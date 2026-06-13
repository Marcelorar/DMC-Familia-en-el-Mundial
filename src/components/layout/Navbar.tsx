import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, BarChart2, Settings, LogIn, Globe, ChevronDown } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import i18n from '@/i18n/index'
import { useState, useRef, useEffect } from 'react'

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'it', label: 'Italiano', short: 'IT' },
]

function detectLanguage(): string {
  const nav = navigator.language || ''
  if (nav.startsWith('es')) return 'es'
  if (nav.startsWith('it')) return 'it'
  return 'en'
}

export function Navbar() {
  const { t } = useTranslation()
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  // Auto-detect language on first mount if not already set by user
  useEffect(() => {
    const stored = localStorage.getItem('i18nextLng')
    if (!stored || stored === 'en-US' || stored === 'en-GB') {
      const detected = detectLanguage()
      i18n.changeLanguage(detected)
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    toast({ title: t('auth.logoutSuccess'), variant: 'default' })
  }

  const currentLang = LANGUAGES.find(l => i18n.language.startsWith(l.code)) ?? LANGUAGES[0]

  const navLinks = [
    { to: '/', label: t('nav.predictions'), icon: <Trophy className="h-4 w-4" /> },
    { to: '/leaderboard', label: t('nav.leaderboard'), icon: <BarChart2 className="h-4 w-4" /> },
    { to: '/admin', label: t('nav.admin'), icon: <Settings className="h-4 w-4" /> },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-primary">
          <span className="text-2xl">⚽</span>
          <span className="hidden sm:inline text-sm font-semibold">Mundial 2026</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to}>
              <Button
                variant={location.pathname === link.to ? 'default' : 'ghost'}
                size="sm"
                className="gap-1.5"
              >
                {link.icon}
                <span className="hidden sm:inline">{link.label}</span>
              </Button>
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <div ref={langRef} className="relative">
            <Button variant="ghost" size="sm" onClick={() => setLangOpen(o => !o)} title={t('common.language')} className="gap-1.5">
              <Globe className="h-4 w-4" />
              <span className="text-xs font-medium">{currentLang.short}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
            {langOpen && (
              <div className="absolute right-0 mt-1 w-36 rounded-md border bg-background shadow-lg z-50">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false) }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors ${currentLang.code === lang.code ? 'font-semibold text-primary' : ''}`}
                  >
                    <span className="w-6 text-xs text-muted-foreground">{lang.short}</span>
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {(profile?.display_name ?? user.email ?? '?')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm text-muted-foreground">
                {profile?.display_name ?? user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                {t('nav.logout')}
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm" className="gap-1.5">
                <LogIn className="h-4 w-4" />
                {t('nav.login')}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
