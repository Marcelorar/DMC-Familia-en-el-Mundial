import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

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
                    <p className="text-xs text-muted-foreground">
                      🎯 {entry.correct_results} · ✅ {entry.partial_results} · ❌ {entry.total_predictions}
                    </p>
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
          <p className="text-sm font-medium mb-2">📊 {t('leaderboard.scoringTitle')}</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>🎯 {t('leaderboard.scoringExact')}</li>
            <li>✅ {t('leaderboard.scoringResult')}</li>
            <li>❌ {t('leaderboard.scoringWrong')}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
