import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n/index'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { getTeamName } from '@/lib/teamUtils'
import { Match, Prediction, PredictionResult, TournamentStage, Team } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { TeamSelect } from '@/components/ui/team-select'

const STAGES: TournamentStage[] = ['GROUP', 'R32', 'R16', 'QF', 'SF', 'F']

function resultBadgeVariant(result: PredictionResult): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (result === 'correct') return 'default'
  if (result === 'partial') return 'secondary'
  if (result === 'miss') return 'destructive'
  return 'outline'
}

const ALL_STATUSES = ['scheduled', 'live', 'completed']

export function PredictionsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [predictions, setPredictions] = useState<Record<string | number, Prediction>>({})
  const [loading, setLoading] = useState(true)
  const [activeStage, setActiveStage] = useState<TournamentStage>('GROUP')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [saving, setSaving] = useState(false)
  const [predictionErrors, setPredictionErrors] = useState<{ home?: string; away?: string }>({})

  // Filters
  const [teamAId, setTeamAId] = useState<number | null>(null)
  const [teamBId, setTeamBId] = useState<number | null>(null)
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>(['live', 'scheduled'])

  useEffect(() => {
    fetchMatches()
    fetchTeams()
    if (user) fetchPredictions()
  }, [user])

  async function fetchTeams() {
    const { data } = await supabase.from('teams').select('*').order('name', { ascending: true })
    if (data) setTeams(data as Team[])
  }

  async function fetchMatches() {
    setLoading(true)
    const { data, error } = await supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .order('match_date', { ascending: true })
    if (!error && data) setMatches(data as Match[])
    setLoading(false)
  }

  async function fetchPredictions() {
    if (!user) return
    const { data } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
    if (data) {
      const map: Record<string | number, Prediction> = {}
      data.forEach((p: Prediction) => { map[p.match_id] = p })
      setPredictions(map)
    }
  }

  function canPredict(match: Match) {
    return Date.now() <= new Date(match.match_date).getTime()
  }

  function openDialog(match: Match) {
    setSelectedMatch(match)
    const existing = predictions[match.id]
    setHomeScore(existing ? String(existing.predicted_home_score) : '')
    setAwayScore(existing ? String(existing.predicted_away_score) : '')
    setPredictionErrors({})
    setDialogOpen(true)
  }

  async function handleSavePrediction() {
    if (!user || !selectedMatch) return
    const hs = parseInt(homeScore)
    const as_ = parseInt(awayScore)
    const perrs: { home?: string; away?: string } = {}
    if (homeScore === '') perrs.home = t('validation.required')
    else if (isNaN(hs) || hs < 0) perrs.home = t('validation.invalidScore')
    if (awayScore === '') perrs.away = t('validation.required')
    else if (isNaN(as_) || as_ < 0) perrs.away = t('validation.invalidScore')
    if (Object.keys(perrs).length > 0) {
      setPredictionErrors(perrs)
      return
    }
    setPredictionErrors({})
    setSaving(true)
    const existing = predictions[selectedMatch.id]
    let error
    if (existing) {
      const res = await supabase
        .from('predictions')
        .update({ predicted_home_score: hs, predicted_away_score: as_, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      error = res.error
    } else {
      const res = await supabase
        .from('predictions')
        .insert({ user_id: user.id, match_id: selectedMatch.id, predicted_home_score: hs, predicted_away_score: as_ })
      error = res.error
    }
    if (error) {
      toast({ title: t('predictions.predictionError'), variant: 'destructive' })
    } else {
      toast({ title: t('predictions.predictionSaved'), variant: 'default' })
      await fetchPredictions()
      setDialogOpen(false)
    }
    setSaving(false)
  }

  const isMatchLive = (match: Match): boolean => {
    if (match.status === 'completed') return false
    const start = new Date(match.match_date).getTime()
    const end = start + 80 * 60 * 1000
    const now = Date.now()
    return now >= start && now < end
  }

  const statusVariant = (match: Match): 'destructive' | 'secondary' | 'outline' => {
    if (isMatchLive(match)) return 'destructive'
    if (match.status === 'completed') return 'secondary'
    return 'outline'
  }

  function toggleStatus(s: string) {
    setStatusFilter(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const stageMatches = useMemo(() => {
    return matches.filter(m => {
      if (m.stage !== activeStage) return false

      // Team A / Team B (non-directional)
      if (teamAId !== null && teamBId !== null) {
        const ids = [m.home_team_id, m.away_team_id]
        if (!ids.includes(teamAId) || !ids.includes(teamBId)) return false
      } else if (teamAId !== null) {
        if (m.home_team_id !== teamAId && m.away_team_id !== teamAId) return false
      } else if (teamBId !== null) {
        if (m.home_team_id !== teamBId && m.away_team_id !== teamBId) return false
      }

      // Date filter
      if (dateFilter) {
        const matchDay = m.match_date.slice(0, 10)
        if (matchDay !== dateFilter) return false
      }

      // Status filter (multi-select)
      if (statusFilter.length > 0) {
        const live = isMatchLive(m)
        const effectiveStatus = live ? 'live' : m.status
        if (!statusFilter.includes(effectiveStatus)) return false
      }

      return true
    })
  }, [matches, activeStage, teamAId, teamBId, dateFilter, statusFilter])

  if (loading) return <div className="text-center py-20 text-muted-foreground">{t('common.loading')}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('predictions.title')}</h1>
        {!user && (
          <Link to="/login">
            <Button variant="outline">{t('predictions.loginToPredict')}</Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label>{t('allPredictions.teamA')}</Label>
            <TeamSelect
              teams={teams}
              value={teamAId !== null ? String(teamAId) : ''}
              onValueChange={v => setTeamAId(v ? Number(v) : null)}
              placeholder={t('common.all')}
            />
          </div>
          <div className="space-y-1">
            <Label>{t('allPredictions.teamB')}</Label>
            <TeamSelect
              teams={teams}
              value={teamBId !== null ? String(teamBId) : ''}
              onValueChange={v => setTeamBId(v ? Number(v) : null)}
              placeholder={t('common.all')}
            />
          </div>
          <div className="space-y-1">
            <Label>{t('admin.matchDate')}</Label>
            <Input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{t('admin.status')}</Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {ALL_STATUSES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStatus(s)}
                  className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                    statusFilter.includes(s)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary'
                  }`}
                >
                  {t(`matches.status.${s}`)}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeStage} onValueChange={v => setActiveStage(v as TournamentStage)}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {STAGES.map(stage => (
            <TabsTrigger key={stage} value={stage} className="text-xs sm:text-sm">
              {t(`stages.${stage}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        {STAGES.map(stage => (
          <TabsContent key={stage} value={stage}>
            {stageMatches.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">{t('matches.noMatches')}</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stageMatches.map(match => {
                  const prediction = predictions[match.id]
                  const open = canPredict(match)
                  return (
                    <Card key={match.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge variant={statusVariant(match)}>
                            {isMatchLive(match) ? t('matches.status.live') : t(`matches.status.${match.status}`)}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {match.home_team?.group_name && (
                              <span className="text-xs text-muted-foreground">
                                {t('matches.group', { group: match.home_team.group_name.toUpperCase() })}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(match.match_date), 'PPp')}
                          {match.venue && ` · ${match.venue}`}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Teams & score */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 text-center">
                            {match.home_team?.flag_url && (
                              <img src={match.home_team.flag_url} alt={match.home_team.code} className="h-8 w-auto mx-auto mb-1" />
                            )}
                            <p className="font-semibold text-sm">
                              {match.home_team ? getTeamName(match.home_team, i18n.language) : '?'}
                            </p>
                          </div>
                          <div className="text-center px-2">
                            {match.status === 'completed' || isMatchLive(match) ? (
                              <span className="text-xl font-bold">
                                {match.home_score ?? 0} – {match.away_score ?? 0}
                              </span>
                            ) : (
                              <span className="text-muted-foreground font-medium">{t('matches.vs')}</span>
                            )}
                          </div>
                          <div className="flex-1 text-center">
                            {match.away_team?.flag_url && (
                              <img src={match.away_team.flag_url} alt={match.away_team.code} className="h-8 w-auto mx-auto mb-1" />
                            )}
                            <p className="font-semibold text-sm">
                              {match.away_team ? getTeamName(match.away_team, i18n.language) : '?'}
                            </p>
                          </div>
                        </div>

                        {/* Prediction */}
                        {user ? (
                          <div className="border-t pt-2">
                            {prediction ? (
                              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
                                {t('predictions.yourPrediction')}:{' '}
                                <span className="font-semibold text-foreground">
                                  {prediction.predicted_home_score} – {prediction.predicted_away_score}
                                </span>
                                <span>
                                {prediction && prediction.result !== 'proposed' && (
                                    <Badge variant={resultBadgeVariant(prediction.result)} className="text-xs">
                                      {t(`predictions.result.${prediction.result}`)}
                                    </Badge>
                                )}
                                  </span>
                              </p>
                            ) : (
                              <p className="text-xs text-center text-muted-foreground">{t('predictions.noPrediction')}</p>
                            )}
                            <Button
                              size="sm"
                              variant={prediction ? 'outline' : 'default'}
                              className="w-full mt-2"
                              disabled={!open}
                              onClick={() => openDialog(match)}
                            >
                              {!open
                                ? t('predictions.closedForPredictions')
                                : prediction
                                ? t('predictions.editPrediction')
                                : t('predictions.predict')}
                            </Button>
                          </div>
                        ) : (
                          <div className="border-t pt-2">
                            <Link to="/login">
                              <Button size="sm" variant="ghost" className="w-full text-xs">
                                {t('predictions.loginToPredict')}
                              </Button>
                            </Link>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Prediction Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {predictions[selectedMatch?.id ?? '']
                ? t('predictions.editPrediction')
                : t('predictions.submitPrediction')}
            </DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>{selectedMatch.home_team ? getTeamName(selectedMatch.home_team, i18n.language) : '?'}</span>
                <span className="text-muted-foreground">{t('matches.vs')}</span>
                <span>{selectedMatch.away_team ? getTeamName(selectedMatch.away_team, i18n.language) : '?'}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>{t('predictions.homeScore')}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={homeScore}
                    onChange={e => { setHomeScore(e.target.value); setPredictionErrors(prev => ({ ...prev, home: undefined })) }}
                    placeholder="0"
                    className={predictionErrors.home ? 'border-red-500' : ''}
                  />
                  {predictionErrors.home && <p className="text-xs text-red-500">{predictionErrors.home}</p>}
                </div>
                <div className="space-y-1">
                  <Label>{t('predictions.awayScore')}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={awayScore}
                    onChange={e => { setAwayScore(e.target.value); setPredictionErrors(prev => ({ ...prev, away: undefined })) }}
                    placeholder="0"
                    className={predictionErrors.away ? 'border-red-500' : ''}
                  />
                  {predictionErrors.away && <p className="text-xs text-red-500">{predictionErrors.away}</p>}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSavePrediction} disabled={saving}>
              {saving ? t('common.loading') : t('predictions.submitPrediction')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
