import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export function LoginPage() {
  const { t } = useTranslation()
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (mode === 'signin') {
      const { error } = await signIn(email, password)
      if (error) {
        toast({ title: t('auth.loginError'), variant: 'destructive' })
      } else {
        toast({ title: t('auth.loginSuccess'), variant: 'default' })
        navigate('/')
      }
    } else if (mode === 'signup') {
      const { error } = await signUp(email, password, displayName)
      if (error) {
        toast({ title: error.message, variant: 'destructive' })
      } else {
        toast({ title: t('auth.signUpSuccess') })
        setMode('signin')
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) {
        toast({ title: error.message, variant: 'destructive' })
      } else {
        toast({ title: t('auth.resetEmailSent') })
        setMode('signin')
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-5xl mb-2">⚽</div>
          <CardTitle className="text-2xl">{t('app.title')}</CardTitle>
          <CardDescription>{t('app.subtitle')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="displayName">{t('auth.displayName')}</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  required
                  placeholder="John Doe"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                {mode === 'signin' && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
                    onClick={() => setMode('forgot')}
                  >
                    {t('auth.forgotPassword')}
                  </button>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? t('common.loading')
                : mode === 'signin'
                ? t('auth.signIn')
                : mode === 'signup'
                ? t('auth.signUp')
                : t('auth.sendResetEmail')}
            </Button>
            {mode === 'forgot' ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={() => setMode('signin')}
              >
                {t('auth.backToLogin')}
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              >
                {mode === 'signin' ? t('auth.noAccount') : t('auth.hasAccount')}
                <span className="ml-1 font-semibold text-primary">
                  {mode === 'signin' ? t('auth.signUp') : t('auth.signIn')}
                </span>
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
