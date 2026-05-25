import type { ProviderFixtureStatus, ProviderTeam } from './types'

export function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

export function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value
  if (typeof value === 'number') return String(value)
  return null
}

export function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function normalizeStatus(value: unknown): ProviderFixtureStatus {
  const status = asString(value)?.toLowerCase() ?? 'scheduled'
  if (
    [
      'live',
      'in_play',
      '1h',
      '2h',
      'ht',
      // BSD API v2
      'inprogress',
      '1st_half',
      '2nd_half',
      'halftime',
      'extratime',
      'penalties',
    ].includes(status)
  )
    return 'live'
  if (['finished', 'ft', 'aet', 'pen'].includes(status)) return 'finished'
  if (['postponed', 'pst'].includes(status)) return 'postponed'
  if (['cancelled', 'canceled', 'cancel'].includes(status)) return 'cancelled'
  return 'scheduled'
}

export function dedupeTeams(teams: ProviderTeam[]): ProviderTeam[] {
  const seen = new Set<string>()
  return teams.filter((team) => {
    if (seen.has(team.id)) return false
    seen.add(team.id)
    return true
  })
}
