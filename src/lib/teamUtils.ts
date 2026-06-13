import { Team } from '@/types'

/**
 * Returns the localized team name based on the current i18n language.
 * Falls back to name_en, then the generic `name` field.
 */
export function getTeamName(team: Team, language: string): string {
  if (language.startsWith('es') && team.name_es) return team.name_es
  if (language.startsWith('it') && team.name_it) return team.name_it
  return team.name_en ?? team.name
}
