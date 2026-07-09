import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Match, MatchChangeRequest, Team, TournamentStage } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ThumbsUp, ThumbsDown, Plus, Edit, Flag, ChevronDown, ChevronRight } from 'lucide-react'
import { TeamSelect } from '@/components/ui/team-select'
import { Link } from 'react-router-dom'
import i18n from '@/i18n/index'
import { getTeamName } from '@/lib/teamUtils'

const STAGES: TournamentStage[] = ['GROUP', 'R32', 'R16', 'QF', 'SF', 'F']

const isKnockoutStage = (stage: string) => stage !== 'GROUP' && stage !== ''

interface MatchFormData {
  home_team_id: string
  away_team_id: string
  stage: TournamentStage | ''
  match_date: string
  venue: string
  home_score: string
  away_score: string
  status: Match['status'] | ''
}

const emptyForm: MatchFormData = {
  home_team_id: '',
  away_team_id: '',
  stage: '',
  match_date: '',
  venue: '',
  home_score: '',
  away_score: '',
  status: 'scheduled',
}

// Converts a UTC ISO string to the "YYYY-MM-DDTHH:mm" format expected by datetime-local inputs,
// using the browser's local timezone so admins see/enter times in their own timezone.
function toLocalDatetimeInput(utcIso: string): string {
  const d = new Date(utcIso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Returns true if the "Finish" button should be shown: match_date + 80 minutes has passed (almost end of match)
function canFinishMatch(match: Match): boolean {
  if (match.status === 'completed') return false
  const finishTime = new Date(match.match_date).getTime() + 80 * 60 * 1000
  return Date.now() >= finishTime
}

// Returns true if a match is currently live (started but not yet finished: within match_date to match_date + 80min)
function isMatchLive(match: Match): boolean {
  if (match.status === 'completed') return false
  const start = new Date(match.match_date).getTime()
  const end = start + 80 * 60 * 1000
  const now = Date.now()
  return now >= start && now < end
}

export function AdminPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [changeRequests, setChangeRequests] = useState<MatchChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [finishDialogOpen, setFinishDialogOpen] = useState(false)
  const [finishingMatch, setFinishingMatch] = useState<Match | null>(null)
  const [finishScores, setFinishScores] = useState({ home: '', away: '' })
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [form, setForm] = useState<MatchFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof MatchFormData, string>>>({})
  const [finishErrors, setFinishErrors] = useState<{ home?: string; away?: string }>({})

  const [expandedStages, setExpandedStages] = useState<TournamentStage[]>(['QF'])

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchTeams(), fetchMatches(), fetchChangeRequests()])
    setLoading(false)
  }

  async function fetchTeams() {
    const { data } = await supabase.from('teams').select('*').order('name')
    if (data) setTeams(data as Team[])
  }

  async function fetchMatches() {
    const { data } = await supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .order('match_date', { ascending: true })
    if (data) setMatches(data as Match[])
  }

  async function fetchChangeRequests() {
    const { data } = await supabase
      .from('match_change_requests')
      .select(`
        *,
        requester:profiles!match_change_requests_requested_by_fkey(*),
        votes:change_request_votes(*, user:profiles(*)),
        match:matches(*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*))
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (data) setChangeRequests(data as MatchChangeRequest[])
  }

  function openCreateDialog() {
    setEditingMatch(null)
    setForm(emptyForm)
    setFormErrors({})
    setDialogOpen(true)
  }

  function openEditDialog(match: Match) {
    setEditingMatch(match)
    setFormErrors({})
    setForm({
      home_team_id: String(match.home_team_id),
      away_team_id: String(match.away_team_id),
      stage: match.stage,
      match_date: toLocalDatetimeInput(match.match_date),
      venue: match.venue ?? '',
      home_score: match.home_score != null ? String(match.home_score) : '',
      away_score: match.away_score != null ? String(match.away_score) : '',
      status: match.status,
    })
    setDialogOpen(true)
  }

  function openFinishDialog(match: Match) {
    setFinishingMatch(match)
    setFinishScores({
      home: match.home_score != null ? String(match.home_score) : '',
      away: match.away_score != null ? String(match.away_score) : '',
    })
    setFinishErrors({})
    setFinishDialogOpen(true)
  }

  async function handleSubmitRequest() {
    if (!user) return
    const errors: Partial<Record<keyof MatchFormData, string>> = {}
    if (!form.stage) errors.stage = t('validation.required')
    if (!form.home_team_id) errors.home_team_id = t('validation.required')
    if (!form.away_team_id) errors.away_team_id = t('validation.required')
    if (form.home_team_id && form.away_team_id && form.home_team_id === form.away_team_id)
      errors.away_team_id = t('validation.sameTeam')
    if (!form.match_date) errors.match_date = t('validation.required')
    if (!form.status) errors.status = t('validation.required')
    if (form.status === 'completed' && form.home_score === '')
      errors.home_score = t('validation.required')
    if (form.status === 'completed' && form.away_score === '')
      errors.away_score = t('validation.required')
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})
    setSaving(true)

    const proposed: Partial<Match> = {
      home_team_id: parseInt(form.home_team_id) as unknown as number,
      away_team_id: parseInt(form.away_team_id) as unknown as number,
      stage: form.stage as TournamentStage,
      match_date: new Date(form.match_date).toISOString(),
      venue: form.venue || undefined,
      status: form.status as Match['status'],
      home_score: form.home_score !== '' ? parseInt(form.home_score) : null,
      away_score: form.away_score !== '' ? parseInt(form.away_score) : null,
    }

    const { error } = await supabase.from('match_change_requests').insert({
      requested_by: user.id,
      match_id: editingMatch?.id ?? null,
      request_type: editingMatch ? 'update' : 'create',
      proposed_data: proposed,
      status: 'pending',
    })

    if (error) {
      toast({ title: t('common.error'), variant: 'destructive' })
    } else {
      toast({ title: t('admin.requestSubmitted') })
      setDialogOpen(false)
      await fetchChangeRequests()
    }
    setSaving(false)
  }

  async function handleSubmitFinish() {
    if (!user || !finishingMatch) return
    const homeScore = parseInt(finishScores.home)
    const awayScore = parseInt(finishScores.away)
    const ferrors: { home?: string; away?: string } = {}
    if (finishScores.home === '') ferrors.home = t('validation.required')
    else if (isNaN(homeScore) || homeScore < 0) ferrors.home = t('validation.invalidScore')
    if (finishScores.away === '') ferrors.away = t('validation.required')
    else if (isNaN(awayScore) || awayScore < 0) ferrors.away = t('validation.invalidScore')
    if (Object.keys(ferrors).length > 0) {
      setFinishErrors(ferrors)
      return
    }
    setFinishErrors({})
    setSaving(true)

    const proposed = {
      status: 'completed' as Match['status'],
      home_score: homeScore,
      away_score: awayScore,
    }

    const { error } = await supabase.from('match_change_requests').insert({
      requested_by: user.id,
      match_id: finishingMatch.id,
      request_type: 'finish',
      proposed_data: proposed,
      status: 'pending',
    })

    if (error) {
      toast({ title: t('common.error'), variant: 'destructive' })
    } else {
      toast({ title: t('admin.requestSubmitted') })
      setFinishDialogOpen(false)
      await fetchChangeRequests()
    }
    setSaving(false)
  }

  async function handleVote(requestId: string, vote: 'approve' | 'deny') {
    if (!user) return
    const request = changeRequests.find(r => r.id === requestId)
    if (!request) return

    if (request.requested_by === user.id) {
      toast({ title: t('admin.cannotVoteOwn'), variant: 'destructive' })
      return
    }

    const alreadyVoted = request.votes?.some(v => v.user_id === user.id)
    if (alreadyVoted) {
      toast({ title: t('admin.alreadyVoted'), variant: 'destructive' })
      return
    }

    const { error } = await supabase.from('change_request_votes').insert({
      change_request_id: requestId,
      user_id: user.id,
      vote,
    })

    if (error) {
      toast({ title: t('common.error'), variant: 'destructive' })
      return
    }

    toast({ title: t('admin.voteSuccess') })

    const updatedVotes = [...(request.votes ?? []), { user_id: user.id, vote, change_request_id: requestId, id: '', created_at: '' }]
    const approvals = updatedVotes.filter(v => v.vote === 'approve').length
    const denials = updatedVotes.filter(v => v.vote === 'deny').length

    if (approvals >= 2) {
      await applyChangeRequest(request)
    } else if (denials >= 2) {
      await supabase.from('match_change_requests').update({ status: 'denied' }).eq('id', requestId)
    }

    await fetchChangeRequests()
    await fetchMatches()
  }

  async function applyChangeRequest(request: MatchChangeRequest) {
    const data = request.proposed_data
    if (request.request_type === 'create') {
      await supabase.from('matches').insert(data)
      await supabase.from('match_change_requests').update({ status: 'approved' }).eq('id', request.id)
    } else if (request.request_type === 'finish' && request.match_id) {
      // Offload match update + prediction grading to an Edge Function to avoid blocking the UI
      const { error } = await supabase.functions.invoke('grade-match', {
        body: {
          match_id: request.match_id,
          home_score: data.home_score,
          away_score: data.away_score,
          change_request_id: request.id,
        },
      })
      if (error) {
        toast({ title: t('common.error'), variant: 'destructive' })
        return
      }
    } else if (request.match_id) {
      await supabase.from('matches').update(data).eq('id', request.match_id)
      await supabase.from('match_change_requests').update({ status: 'approved' }).eq('id', request.id)
    }
  }

  const setField = (field: keyof MatchFormData, value: string) => setForm(f => ({ ...f, [field]: value }))

  const toggleStage = (stage: TournamentStage) => {
    setExpandedStages(prev =>
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
    )
  }

  function buildDiffRows(req: MatchChangeRequest) {
    const cur = req.match!
    const prop = req.proposed_data
    const curHome = teams.find(t => t.id === cur.home_team_id)
    const curAway = teams.find(t => t.id === cur.away_team_id)
    
    // For "after" values, we use the proposed value if it exists, otherwise the current value
    const propHomeId = prop.home_team_id ?? cur.home_team_id
    const propAwayId = prop.away_team_id ?? cur.away_team_id
    const propHome = teams.find(t => t.id === propHomeId)
    const propAway = teams.find(t => t.id === propAwayId)
    const propStage = prop.stage ?? cur.stage
    
    const rows: { label: string; before: string; after: string; changed: boolean }[] = []

    const stageB = cur.stage ? t(`stages.${cur.stage}`) : '—'
    const stageA = propStage ? t(`stages.${propStage}`) : '—'
    rows.push({ label: t('admin.stage'), before: stageB, after: stageA, changed: 'stage' in prop && stageB !== stageA })

    const homeB = curHome ? getTeamName(curHome, i18n.language) : String(cur.home_team_id)
    const homeA = propHome ? getTeamName(propHome, i18n.language) : (propHomeId ? String(propHomeId) : '—')
    const homeLabel = `${t('admin.homeTeam')} (${homeB})`
    rows.push({ label: homeLabel, before: homeB, after: homeA, changed: 'home_team_id' in prop && homeB !== homeA })

    const awayB = curAway ? getTeamName(curAway, i18n.language) : String(cur.away_team_id)
    const awayA = propAway ? getTeamName(propAway, i18n.language) : (propAwayId ? String(propAwayId) : '—')
    const awayLabel = `${t('admin.awayTeam')} (${awayB})`
    rows.push({ label: awayLabel, before: awayB, after: awayA, changed: 'away_team_id' in prop && awayB !== awayA })

    const dateB = cur.match_date ? format(new Date(cur.match_date), 'PPp') : '—'
    const dateA = prop.match_date ? format(new Date(prop.match_date), 'PPp') : dateB
    rows.push({ label: t('admin.matchDate'), before: dateB, after: dateA, changed: 'match_date' in prop && dateB !== dateA })

    const venueB = cur.venue ?? '—'
    const venueA = prop.venue ?? venueB
    rows.push({ label: t('admin.venue'), before: venueB, after: venueA, changed: 'venue' in prop && venueB !== venueA })

    const statusB = cur.status ? t(`matches.status.${cur.status}`) : '—'
    const statusA = prop.status ? t(`matches.status.${prop.status}`) : statusB
    rows.push({ label: t('admin.status'), before: statusB, after: statusA, changed: 'status' in prop && statusB !== statusA })

    const homeScoreB = cur.home_score != null ? String(cur.home_score) : '—'
    const homeScoreA = prop.home_score != null ? String(prop.home_score) : homeScoreB

    const awayScoreB = cur.away_score != null ? String(cur.away_score) : '—'
    const awayScoreA = prop.away_score != null ? String(prop.away_score) : awayScoreB
    
    // For knockout stages, display "Winner" instead of raw 999 score
    if (isKnockoutStage(propStage || '')) {
      const winnerB = cur.home_score === 999 ? homeB : cur.away_score === 999 ? awayB : '—'
      const propHomeScore = prop.home_score ?? cur.home_score
      const propAwayScore = prop.away_score ?? cur.away_score
      const winnerA = propHomeScore === 999 ? homeA : propAwayScore === 999 ? awayA : '—'
      
      rows.push({ 
        label: t('admin.winner'), 
        before: winnerB, 
        after: winnerA, 
        changed: (('home_score' in prop) || ('away_score' in prop)) && winnerB !== winnerA 
      })
    } else {
      const homeScoreLabel = curHome ? `${t('admin.homeScore')} (${getTeamName(curHome, i18n.language)})` : t('admin.homeScore')
      rows.push({ label: homeScoreLabel, before: homeScoreB, after: homeScoreA, changed: 'home_score' in prop && homeScoreB !== homeScoreA })

      const awayScoreLabel = curAway ? `${t('admin.awayScore')} (${getTeamName(curAway, i18n.language)})` : t('admin.awayScore')
      rows.push({ label: awayScoreLabel, before: awayScoreB, after: awayScoreA, changed: 'away_score' in prop && awayScoreB !== awayScoreA })
    }

    return rows
  }

  if (loading) return <div className="text-center py-20 text-muted-foreground">{t('common.loading')}</div>

  if (!user) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-muted-foreground">{t('predictions.loginToPredict')}</p>
        <Link to="/login"><Button>{t('auth.signIn')}</Button></Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('admin.addMatch')}
        </Button>
      </div>

      <Tabs defaultValue="matches">
        <TabsList>
          <TabsTrigger value="matches">{t('matches.title')}</TabsTrigger>
          <TabsTrigger value="requests">
            {t('admin.changeRequests')}
            {changeRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {changeRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Matches list */}
        <TabsContent value="matches" className="space-y-4">
          {STAGES.map(stage => {
            const stageMatches = matches.filter(m => m.stage === stage)
            if (stageMatches.length === 0) return null
            const isExpanded = expandedStages.includes(stage)
            return (
              <div key={stage} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleStage(stage)}
                  className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <h2 className="text-lg font-semibold">{t(`stages.${stage}`)}</h2>
                  {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
                {isExpanded && (
                  <div className="p-4 pt-0">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-3">
                      {stageMatches.map(match => (
                        <Card key={match.id}>
                          <CardContent className="pt-4 pb-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant={isMatchLive(match) ? 'destructive' : match.status === 'completed' ? 'secondary' : 'outline'}>
                                {isMatchLive(match) ? t('matches.status.live') : t(`matches.status.${match.status}`)}
                              </Badge>
                              <div className="flex gap-1">
                                {canFinishMatch(match) && (
                                  <Button size="icon" variant="ghost" className="text-green-600 hover:text-green-700" onClick={() => openFinishDialog(match)} title={t('admin.finishMatch')}>
                                    <Flag className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button size="icon" variant="ghost" onClick={() => openEditDialog(match)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-1">
                                {match.home_team?.flag_url && <img src={match.home_team.flag_url} alt={match.home_team.code} className="h-5 w-auto" />}
                                <span className="font-medium">{match.home_team ? getTeamName(match.home_team, i18n.language) : '?'}</span>
                              </div>
                              <span className="text-muted-foreground px-2">
                                {match.status !== 'scheduled' ? `${match.home_score ?? 0}–${match.away_score ?? 0}` : 'vs'}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">{match.away_team ? getTeamName(match.away_team, i18n.language) : '?'}</span>
                                {match.away_team?.flag_url && <img src={match.away_team.flag_url} alt={match.away_team.code} className="h-5 w-auto" />}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(match.match_date), 'PPp')}
                            </p>
                            {match.venue && <p className="text-xs text-muted-foreground truncate">{match.venue}</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {matches.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">{t('matches.noMatches')}</div>
          )}
        </TabsContent>

        {/* Change requests */}
        <TabsContent value="requests" className="space-y-4">
          {changeRequests.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">{t('admin.noRequests')}</div>
          ) : (
            changeRequests.map(req => {
              const approvals = req.votes?.filter(v => v.vote === 'approve').length ?? 0
              const denials = req.votes?.filter(v => v.vote === 'deny').length ?? 0
              const myVote = req.votes?.find(v => v.user_id === user.id)
              const isOwner = req.requested_by === user.id
              const homeTeam = teams.find(t => t.id === req.proposed_data.home_team_id)
              const awayTeam = teams.find(t => t.id === req.proposed_data.away_team_id)

              return (
                <Card key={req.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={req.request_type === 'create' ? 'default' : req.request_type === 'finish' ? 'destructive' : 'secondary'}>
                        {t(`admin.requestType.${req.request_type}`)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {t('admin.requestedBy')}: <strong>{req.requester?.display_name ?? req.requester?.email}</strong>
                      </span>
                    </div>
                    <CardDescription className="text-xs">
                      {format(new Date(req.created_at), 'PPp')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {req.match && (() => {
                      const mHome = teams.find(t => t.id === req.match!.home_team_id)
                      const mAway = teams.find(t => t.id === req.match!.away_team_id)
                      return (
                        <div className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2 text-sm">
                          {mHome?.flag_url && <img src={mHome.flag_url} alt="" className="h-5 w-5 object-cover rounded-sm" />}
                          <span className="font-semibold">{mHome ? getTeamName(mHome, i18n.language) : req.match!.home_team_id}</span>
                          <span className="text-muted-foreground">vs</span>
                          <span className="font-semibold">{mAway ? getTeamName(mAway, i18n.language) : req.match!.away_team_id}</span>
                          {mAway?.flag_url && <img src={mAway.flag_url} alt="" className="h-5 w-5 object-cover rounded-sm" />}
                          <span className="ml-auto text-xs text-muted-foreground">{req.match!.match_date ? format(new Date(req.match!.match_date), 'PPp') : ''}</span>
                        </div>
                      )
                    })()}
                    {(req.request_type === 'finish' || req.request_type === 'update') && req.match ? (
                      <div className="rounded-md border text-sm overflow-hidden">
                        <div className="grid grid-cols-3 bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          <span>{t('admin.field')}</span>
                          <span className="text-red-600">{t('admin.before')}</span>
                          <span className="text-green-600">{t('admin.after')}</span>
                        </div>
                        {buildDiffRows(req).map((row, i) => (
                          <div key={i} className={`grid grid-cols-3 border-t px-3 py-2 ${row.changed ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}`}>
                            <span className="text-muted-foreground text-xs">{row.label}</span>
                            <span className={`text-xs ${row.changed ? 'line-through text-red-500' : 'text-foreground'}`}>{row.before}</span>
                            <span className={`text-xs font-medium ${row.changed ? 'text-green-700 dark:text-green-400' : 'text-foreground'}`}>{row.after}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-md border text-sm overflow-hidden">
                        <div className="bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('admin.proposedChanges')}</div>
                        <div className="divide-y">
                          <div className="grid grid-cols-2 px-3 py-2">
                            <span className="text-muted-foreground text-xs">{t('admin.stage')}</span>
                            <span className="text-xs font-medium">{req.proposed_data.stage ? t(`stages.${req.proposed_data.stage}`) : '—'}</span>
                          </div>
                          {homeTeam && awayTeam && (
                            <div className="grid grid-cols-2 px-3 py-2">
                              <span className="text-muted-foreground text-xs">{t('admin.teams')}</span>
                              <span className="text-xs font-medium">{getTeamName(homeTeam, i18n.language)} vs {getTeamName(awayTeam, i18n.language)}</span>
                            </div>
                          )}
                          {req.proposed_data.match_date && (
                            <div className="grid grid-cols-2 px-3 py-2">
                              <span className="text-muted-foreground text-xs">{t('admin.matchDate')}</span>
                              <span className="text-xs font-medium">{format(new Date(req.proposed_data.match_date), 'PPp')}</span>
                            </div>
                          )}
                          {req.proposed_data.venue && (
                            <div className="grid grid-cols-2 px-3 py-2">
                              <span className="text-muted-foreground text-xs">{t('admin.venue')}</span>
                              <span className="text-xs font-medium">{req.proposed_data.venue}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">👍 {approvals} · 👎 {denials}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {isOwner ? (
                        <span className="text-xs text-muted-foreground italic">{t('admin.cannotVoteOwn')}</span>
                      ) : myVote ? (
                        <Badge variant="outline" className="text-xs">
                          {myVote.vote === 'approve' ? '👍' : '👎'} {t('admin.voteSuccess')}
                        </Badge>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" className="gap-1 text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleVote(req.id, 'approve')}>
                            <ThumbsUp className="h-3.5 w-3.5" />
                            {t('admin.approve')}
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1 text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleVote(req.id, 'deny')}>
                            <ThumbsDown className="h-3.5 w-3.5" />
                            {t('admin.deny')}
                          </Button>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ℹ️ {t('admin.autoApplyHint')}
                    </p>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Match Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMatch ? t('admin.editMatch') : t('admin.addMatch')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Stage */}
            <div className="space-y-1">
              <Label>{t('admin.stage')}</Label>
              <Select value={form.stage} onValueChange={v => { setField('stage', v); setFormErrors(e => ({ ...e, stage: undefined })) }}>
                <SelectTrigger className={formErrors.stage ? 'border-red-500' : ''}><SelectValue placeholder={t('admin.selectStage')} /></SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => <SelectItem key={s} value={s}>{t(`stages.${s}`)}</SelectItem>)}
                </SelectContent>
              </Select>
              {formErrors.stage && <p className="text-xs text-red-500">{formErrors.stage}</p>}
            </div>

            {/* Teams */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('admin.homeTeam')}</Label>
                <TeamSelect
                  teams={teams}
                  value={form.home_team_id}
                  onValueChange={v => { setField('home_team_id', v); setFormErrors(e => ({ ...e, home_team_id: undefined })) }}
                  placeholder={t('admin.selectTeam')}
                  error={!!formErrors.home_team_id}
                />
                {formErrors.home_team_id && <p className="text-xs text-red-500">{formErrors.home_team_id}</p>}
              </div>
              <div className="space-y-1">
                <Label>{t('admin.awayTeam')}</Label>
                <TeamSelect
                  teams={teams}
                  value={form.away_team_id}
                  onValueChange={v => { setField('away_team_id', v); setFormErrors(e => ({ ...e, away_team_id: undefined })) }}
                  placeholder={t('admin.selectTeam')}
                  error={!!formErrors.away_team_id}
                />
                {formErrors.away_team_id && <p className="text-xs text-red-500">{formErrors.away_team_id}</p>}
              </div>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <Label>{t('admin.matchDate')}</Label>
              <Input type="datetime-local" value={form.match_date} onChange={e => { setField('match_date', e.target.value); setFormErrors(er => ({ ...er, match_date: undefined })) }} className={formErrors.match_date ? 'border-red-500' : ''} />
              {formErrors.match_date && <p className="text-xs text-red-500">{formErrors.match_date}</p>}
            </div>

            {/* Venue */}
            <div className="space-y-1">
              <Label>{t('admin.venue')}</Label>
              <Input value={form.venue} onChange={e => setField('venue', e.target.value)} placeholder="e.g. MetLife Stadium" />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label>{t('admin.status')}</Label>
              <Select value={form.status} onValueChange={v => { setField('status', v); setFormErrors(e => ({ ...e, status: undefined })) }}>
                <SelectTrigger className={formErrors.status ? 'border-red-500' : ''}><SelectValue placeholder={t('admin.selectStatus')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">{t('matches.status.scheduled')}</SelectItem>
                  <SelectItem value="completed">{t('matches.status.completed')}</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.status && <p className="text-xs text-red-500">{formErrors.status}</p>}
            </div>

            {/* Scores (only for completed) */}
            {form.status === 'completed' && (
              isKnockoutStage(form.stage) ? (
                <div className="space-y-3">
                  <Label>{t('admin.winner')}</Label>
                  <RadioGroup
                    value={form.home_score === '999' ? 'home' : form.away_score === '999' ? 'away' : ''}
                    onValueChange={v => {
                      setForm(f => ({
                        ...f,
                        home_score: v === 'home' ? '999' : '0',
                        away_score: v === 'away' ? '999' : '0'
                      }))
                      setFormErrors(e => ({ ...e, home_score: undefined, away_score: undefined }))
                    }}
                    className="grid grid-cols-2 gap-2"
                  >
                    <div>
                      <RadioGroupItem value="home" id="form-home" className="peer sr-only" />
                      <Label
                        htmlFor="form-home"
                        className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <span className="text-sm font-semibold truncate w-full text-center">
                          {form.home_team_id ? (() => {
                            const team = teams.find(t => String(t.id) === form.home_team_id);
                            return team ? getTeamName(team, i18n.language) : t('admin.homeTeam');
                          })() : t('admin.homeTeam')}
                        </span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="away" id="form-away" className="peer sr-only" />
                      <Label
                        htmlFor="form-away"
                        className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <span className="text-sm font-semibold truncate w-full text-center">
                          {form.away_team_id ? (() => {
                            const team = teams.find(t => String(t.id) === form.away_team_id);
                            return team ? getTeamName(team, i18n.language) : t('admin.awayTeam');
                          })() : t('admin.awayTeam')}
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                  {(formErrors.home_score || formErrors.away_score) && (
                    <p className="text-xs text-red-500">{t('validation.required')}</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>{t('admin.homeScore')}</Label>
                    <Input type="number" min={0} value={form.home_score} onChange={e => { setField('home_score', e.target.value); setFormErrors(er => ({ ...er, home_score: undefined })) }} placeholder="0" className={formErrors.home_score ? 'border-red-500' : ''} />
                    {formErrors.home_score && <p className="text-xs text-red-500">{formErrors.home_score}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>{t('admin.awayScore')}</Label>
                    <Input type="number" min={0} value={form.away_score} onChange={e => { setField('away_score', e.target.value); setFormErrors(er => ({ ...er, away_score: undefined })) }} placeholder="0" className={formErrors.away_score ? 'border-red-500' : ''} />
                    {formErrors.away_score && <p className="text-xs text-red-500">{formErrors.away_score}</p>}
                  </div>
                </div>
              )
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmitRequest} disabled={saving}>
              {saving ? t('common.loading') : t('admin.submitRequest')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finish Match Dialog */}
      <Dialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('admin.finishMatch')}</DialogTitle>
          </DialogHeader>
          {finishingMatch && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {finishingMatch.home_team ? getTeamName(finishingMatch.home_team, i18n.language) : '?'}
                {' vs '}
                {finishingMatch.away_team ? getTeamName(finishingMatch.away_team, i18n.language) : '?'}
              </p>
              
              {isKnockoutStage(finishingMatch.stage) ? (
                <div className="space-y-3">
                  <Label>{t('admin.winner')}</Label>
                  <RadioGroup
                    value={finishScores.home === '999' ? 'home' : finishScores.away === '999' ? 'away' : ''}
                    onValueChange={v => {
                      setFinishScores({
                        home: v === 'home' ? '999' : '0',
                        away: v === 'away' ? '999' : '0'
                      })
                      setFinishErrors({})
                    }}
                    className="grid grid-cols-2 gap-2"
                  >
                    <div>
                      <RadioGroupItem value="home" id="finish-home" className="peer sr-only" />
                      <Label
                        htmlFor="finish-home"
                        className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <span className="text-sm font-semibold truncate w-full text-center">
                          {finishingMatch.home_team ? getTeamName(finishingMatch.home_team, i18n.language) : t('admin.homeTeam')}
                        </span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="away" id="finish-away" className="peer sr-only" />
                      <Label
                        htmlFor="finish-away"
                        className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <span className="text-sm font-semibold truncate w-full text-center">
                          {finishingMatch.away_team ? getTeamName(finishingMatch.away_team, i18n.language) : t('admin.awayTeam')}
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                  {(finishErrors.home || finishErrors.away) && (
                    <p className="text-xs text-red-500">{t('validation.required')}</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>{t('admin.homeScore')}</Label>
                    <Input
                      type="number" min={0}
                      value={finishScores.home}
                      onChange={e => { setFinishScores(s => ({ ...s, home: e.target.value })); setFinishErrors(er => ({ ...er, home: undefined })) }}
                      placeholder="0"
                      className={finishErrors.home ? 'border-red-500' : ''}
                    />
                    {finishErrors.home && <p className="text-xs text-red-500">{finishErrors.home}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>{t('admin.awayScore')}</Label>
                    <Input
                      type="number" min={0}
                      value={finishScores.away}
                      onChange={e => { setFinishScores(s => ({ ...s, away: e.target.value })); setFinishErrors(er => ({ ...er, away: undefined })) }}
                      placeholder="0"
                      className={finishErrors.away ? 'border-red-500' : ''}
                    />
                    {finishErrors.away && <p className="text-xs text-red-500">{finishErrors.away}</p>}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">{t('admin.finishMatchHint')}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinishDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmitFinish} disabled={saving}>
              {saving ? t('common.loading') : t('admin.submitRequest')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
