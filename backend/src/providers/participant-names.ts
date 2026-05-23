import type { ProviderFixture, ProviderTeam } from './types'

/**
 * BSD / FIFA-style bracket placeholders: winner paths (W74), group slots (1A, H2),
 * or multi-group third-place formulas (3C/3E/3F/...). Not real team names until the draw resolves.
 */
export function isLikelyBracketPlaceholder(name: string | null | undefined): boolean {
  if (!name) return false
  const n = name.trim()
  if (n.length < 2) return false
  // "3C/3E/3F/3H/3I" — best-third paths (any length)
  if (/\d[A-Z]\/\d[A-Z]/i.test(n)) return true
  if (/^W\d+$/i.test(n)) return true
  if (/^L\d+$/i.test(n)) return true
  if (/^[12][A-L]$/i.test(n)) return true
  if (/^[A-L][12]$/i.test(n)) return true
  if (/^[A-L]\d$/i.test(n)) return true
  return false
}

export function applyFlatParticipantLabel(team: ProviderTeam, flatLabelRaw: unknown): ProviderTeam {
  if (typeof flatLabelRaw !== 'string') return team
  const flat = flatLabelRaw.trim()
  if (flat.length < 3) return team
  if (!isLikelyBracketPlaceholder(team.name)) return team
  if (isLikelyBracketPlaceholder(flat)) return team
  return { ...team, name: flat, shortName: team.shortName ?? undefined }
}

/**
 * World Cup–style rows: name is a bracket code (1A, W74) but `country` is already the nation ("France").
 * Show the country as the display name; keep the code in shortName when useful.
 */
export function preferCountryOverBracketPlaceholder(team: ProviderTeam): ProviderTeam {
  if (!isLikelyBracketPlaceholder(team.name)) return team
  const country = team.country?.trim()
  if (!country) return team
  const code = team.name.trim()
  const keepShort =
    team.shortName?.trim() && !isLikelyBracketPlaceholder(team.shortName) ? team.shortName : code
  return { ...team, name: country, shortName: keepShort }
}

export function enrichFixturesTeamsFromRoster(
  fixtures: ProviderFixture[],
  roster: ProviderTeam[]
): ProviderFixture[] {
  const byId = new Map(roster.map((t) => [t.id, t]))
  return fixtures.map((f) => ({
    ...f,
    homeTeam: mergeTeamWithRoster(f.homeTeam, byId.get(f.homeTeam.id)),
    awayTeam: mergeTeamWithRoster(f.awayTeam, byId.get(f.awayTeam.id)),
  }))
}

function mergeTeamWithRoster(side: ProviderTeam, roster?: ProviderTeam): ProviderTeam {
  if (!roster) return side
  const useRosterName =
    isLikelyBracketPlaceholder(side.name) &&
    Boolean(roster.name) &&
    !isLikelyBracketPlaceholder(roster.name)
  return {
    ...side,
    name: useRosterName ? roster.name : side.name,
    shortName: side.shortName ?? roster.shortName ?? undefined,
    country: side.country ?? roster.country,
    logoUrl: side.logoUrl ?? roster.logoUrl,
  }
}
