import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Target, CheckCircle2, XCircle, BarChart2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface LeaderboardEntry {
  user_id: string
  display_name: string
  total_points: number
  correct_results: number
  partial_results: number
  total_predictions: number
}

export function LeaderboardPage() {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  async function fetchLeaderboard() {
    setLoading(true)
    // Use the leaderboard view created in the migration
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('total_points', { ascending: false })
    if (!error && data) setEntries(data as LeaderboardEntry[])
    setLoading(false)
  }

  if (loading) return <div className="text-center py-20 text-muted-foreground">{t('common.loading')}</div>

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold">{t('leaderboard.title')}</h1>

      {entries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">{t('leaderboard.noData')}</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('leaderboard.title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {entries.map((entry, index) => (
                <div key={entry.user_id} className="flex items-center gap-4 px-6 py-4">
                  {/* Rank */}
                  <div className="w-8 text-center">
                    {index === 0 ? (
                      <span className="text-2xl">🥇</span>
                    ) : index === 1 ? (
                      <span className="text-2xl">🥈</span>
                    ) : index === 2 ? (
                      <span className="text-2xl">🥉</span>
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">#{index + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {entry.display_name[0]?.toUpperCase() ?? '?'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <div className="flex-1">
                    <p className="font-medium">{entry.display_name}</p>
                    <TooltipProvider>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Target className="h-3 w-3 text-green-500" />
                              {entry.correct_results}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{t('leaderboard.scoringExact')}</TooltipContent>
                        </Tooltip>
                        <span className="text-xs text-muted-foreground">·</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CheckCircle2 className="h-3 w-3 text-yellow-500" />
                              {entry.partial_results}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{t('leaderboard.scoringResult')}</TooltipContent>
                        </Tooltip>
                        <span className="text-xs text-muted-foreground">·</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <XCircle className="h-3 w-3 text-red-500" />
                              {entry.total_predictions}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{t('leaderboard.scoringWrong')}</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>

                  {/* Points */}
                  <Badge variant="default" className="text-sm px-3 py-1">
                    {entry.total_points} {t('leaderboard.points')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scoring legend */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4 pb-4">
          <p className="flex items-center gap-2 text-sm font-medium mb-2">
            <BarChart2 className="h-4 w-4" />
            {t('leaderboard.scoringTitle')}
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className="flex items-center gap-2"><Target className="h-3 w-3 text-green-500" /> {t('leaderboard.scoringExact')}</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-yellow-500" /> {t('leaderboard.scoringResult')}</li>
            <li className="flex items-center gap-2"><XCircle className="h-3 w-3 text-red-500" /> {t('leaderboard.scoringWrong')}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
