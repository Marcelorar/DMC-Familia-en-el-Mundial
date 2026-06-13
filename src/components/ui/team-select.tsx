import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n/index'
import { getTeamName } from '@/lib/teamUtils'
import { Team } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TeamSelectProps {
  teams: Team[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  error?: boolean
}

export function TeamSelect({ teams, value, onValueChange, placeholder, error }: TeamSelectProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = teams.find(t => String(t.id) === value)

  const filtered = filter.trim()
    ? teams.filter(team => {
        const name = getTeamName(team, i18n.language).toLowerCase()
        const code = team.code.toLowerCase()
        const q = filter.toLowerCase()
        return name.includes(q) || code.includes(q)
      })
    : teams

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setFilter('')
    }
  }, [open])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background',
          'focus:outline-none focus:ring-1 focus:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500'
        )}
      >
        {selected ? (
          <span className="flex items-center gap-2 truncate">
            {selected.flag_url && (
              <img src={selected.flag_url} alt={selected.code} className="h-4 w-auto shrink-0" />
            )}
            <span className="truncate">{getTeamName(selected, i18n.language)}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder ?? t('admin.selectTeam')}</span>
        )}
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          {/* Filter input */}
          <div className="flex items-center border-b px-2 py-1.5 gap-1">
            <Input
              ref={inputRef}
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder={t('common.search') ?? 'Search…'}
              className="h-7 border-0 shadow-none focus-visible:ring-0 px-1 text-sm"
            />
            {filter && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => setFilter('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Options list */}
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">{t('common.noResults') ?? 'No results'}</li>
            ) : (
              filtered.map(team => (
                <li
                  key={team.id}
                  onClick={() => { onValueChange(String(team.id)); setOpen(false) }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground',
                    String(team.id) === value && 'bg-accent/50 font-medium'
                  )}
                >
                  {team.flag_url && (
                    <img src={team.flag_url} alt={team.code} className="h-4 w-auto shrink-0" />
                  )}
                  <span>{getTeamName(team, i18n.language)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
