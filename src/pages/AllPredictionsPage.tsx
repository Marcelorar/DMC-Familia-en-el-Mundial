import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { getTeamName } from '@/lib/teamUtils'
import { TeamSelect } from '@/components/ui/team-select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Match, Team, UserProfile, TournamentStage } from '@/types'

interface PredictionRow {
  id: string
  user_id: string
  match_id: number
  predicted_home_score: number
  predicted_away_score: number
  result: string
  match: Match & { home_team: Team; away_team: Team }
  user: UserProfile
}

const STAGES: TournamentStage[] = ['GROUP', 'R32', 'R16', 'QF', 'SF', 'F']

function isMatchLive(match: Match): boolean {
  const now = Date.now()
  const start = new Date(match.match_date).getTime()
  const end = start + 80 * 60 * 1000
  return now >= start && now <= end && match.status !== 'completed'
}

function resultVariant(result: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (result === 'correct') return 'default'
  if (result === 'partial') return 'secondary'
  if (result === 'miss') return 'destructive'
  return 'outline'
}

export function AllPredictionsPage() {
  const { t, i18n } = useTranslation()

  const [predictions, setPredictions] = useState<PredictionRow[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [teamAId, setTeamAId] = useState<number | null>(null)
  const [teamBId, setTeamBId] = useState<number | null>(null)
  const [userFilter, setUserFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stageFilter, setStageFilter] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: teamsData }, { data: predsData }] = await Promise.all([
      supabase.from('teams').select('*').order('name', { ascending: true }),
      supabase
        .from('predictions')
        .select(`
          *,
          match:matches(*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)),
          user:profiles(*)
        `)
        .order('created_at', { ascending: false }),
    ])
    setTeams(teamsData ?? [])
    setPredictions((predsData as unknown as PredictionRow[]) ?? [])
    setLoading(false)
  }

  const filtered = useMemo(() => {
    return predictions.filter(p => {
      const match = p.match
      if (!match) return false

      // Team A / Team B filter (non-directional)
      if (teamAId !== null && teamBId !== null) {
        const ids = [match.home_team_id, match.away_team_id]
        if (!ids.includes(teamAId) || !ids.includes(teamBId)) return false
      } else if (teamAId !== null) {
        if (match.home_team_id !== teamAId && match.away_team_id !== teamAId) return false
      } else if (teamBId !== null) {
        if (match.home_team_id !== teamBId && match.away_team_id !== teamBId) return false
      }

      // User filter
      if (userFilter.trim()) {
        const name = p.user?.display_name?.toLowerCase() ?? ''
        const email = p.user?.email?.toLowerCase() ?? ''
        const q = userFilter.toLowerCase()
        if (!name.includes(q) && !email.includes(q)) return false
      }

      // Date filter (compare in local timezone)
      if (dateFilter) {
        const matchDay = new Date(match.match_date).toLocaleDateString('en-CA') // YYYY-MM-DD in local tz
        if (matchDay !== dateFilter) return false
      }

      // Status filter
      if (statusFilter !== 'all') {
        const live = isMatchLive(match)
        const effectiveStatus = live ? 'live' : match.status
        if (effectiveStatus !== statusFilter) return false
      }

      // Stage filter
      if (stageFilter !== 'all') {
        if (match.stage !== stageFilter) return false
      }

      return true
    })
  }, [predictions, teamAId, teamBId, userFilter, dateFilter, statusFilter, stageFilter])

  // Group by match
  const byMatch = useMemo(() => {
    const map = new Map<number, { match: PredictionRow['match']; preds: PredictionRow[] }>()
    for (const p of filtered) {
      if (!map.has(p.match_id)) {
        map.set(p.match_id, { match: p.match, preds: [] })
      }
      map.get(p.match_id)!.preds.push(p)
    }
    // Sort by match date
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.match.match_date).getTime() - new Date(b.match.match_date).getTime()
    )
  }, [filtered])

  if (loading) return <div className="text-center py-20 text-muted-foreground">{t('common.loading')}</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('predictions.allPredictions')}</h1>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Team A */}
          <div className="space-y-1">
            <Label>{t('allPredictions.teamA')}</Label>
            <TeamSelect
              teams={teams}
              value={teamAId !== null ? String(teamAId) : ''}
              onValueChange={v => setTeamAId(v ? Number(v) : null)}
              placeholder={t('common.all')}
            />
          </div>

          {/* Team B */}
          <div className="space-y-1">
            <Label>{t('allPredictions.teamB')}</Label>
            <TeamSelect
              teams={teams}
              value={teamBId !== null ? String(teamBId) : ''}
              onValueChange={v => setTeamBId(v ? Number(v) : null)}
              placeholder={t('common.all')}
            />
          </div>

          {/* User */}
          <div className="space-y-1">
            <Label>{t('allPredictions.user')}</Label>
            <Input
              placeholder={t('common.search')}
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
            />
          </div>

          {/* Date */}
          <div className="space-y-1">
            <Label>{t('admin.matchDate')}</Label>
            <Input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label>{t('admin.status')}</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="scheduled">{t('matches.status.scheduled')}</SelectItem>
                <SelectItem value="live">{t('matches.status.live')}</SelectItem>
                <SelectItem value="completed">{t('matches.status.completed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stage */}
          <div className="space-y-1">
            <Label>{t('admin.stage')}</Label>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {STAGES.map(s => (
                  <SelectItem key={s} value={s}>{t(`stages.${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {byMatch.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">{t('common.noResults')}</p>
      ) : (
        <div className="space-y-4">
          {byMatch.map(({ match, preds }) => {
            const home = match.home_team
            const away = match.away_team
            const live = isMatchLive(match)
            const statusLabel = live ? t('matches.status.live') : t(`matches.status.${match.status}`)
            const statusVariant = live ? 'default' : match.status === 'completed' ? 'secondary' : 'outline'

            return (
              <Card key={match.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Home team */}
                    <div className="flex items-center gap-1.5">
                      {home?.flag_url && <img src={home.flag_url} alt="" className="h-5 w-5 object-cover rounded-sm" />}
                      <span className="font-semibold">{home ? getTeamName(home, i18n.language) : match.home_team_id}</span>
                    </div>
                    <span className="text-muted-foreground text-sm">vs</span>
                    {/* Away team */}
                    <div className="flex items-center gap-1.5">
                      {away?.flag_url && <img src={away.flag_url} alt="" className="h-5 w-5 object-cover rounded-sm" />}
                      <span className="font-semibold">{away ? getTeamName(away, i18n.language) : match.away_team_id}</span>
                    </div>

                    <div className="ml-auto flex items-center gap-2 flex-wrap">
                      {(match.status === 'completed' || live) && match.home_score != null && (
                        <span className="text-sm font-mono font-bold">{match.home_score} – {match.away_score}</span>
                      )}
                      <Badge variant={statusVariant as any}>{statusLabel}</Badge>
                      <Badge variant="outline">{t(`stages.${match.stage}`)}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(match.match_date), 'PPp')}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-xs text-muted-foreground uppercase tracking-wide">
                          <th className="text-left py-1.5 pr-4">{t('allPredictions.user')}</th>
                          <th className="text-center py-1.5 px-4">{t('allPredictions.prediction')}</th>
                          <th className="text-center py-1.5 pl-4">{t('allPredictions.result')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preds.map(p => (
                          <tr key={p.id} className="border-b last:border-0">
                            <td className="py-2 pr-4">
                              <span className="font-medium">{p.user?.display_name ?? p.user?.email ?? p.user_id}</span>
                            </td>
                            <td className="py-2 px-4 text-center font-mono font-semibold">
                              {p.predicted_home_score} – {p.predicted_away_score}
                            </td>
                            <td className="py-2 pl-4 text-center">
                              {p.result ? (
                                <Badge variant={resultVariant(p.result)}>
                                  {t(`predictions.result.${p.result}`)}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
