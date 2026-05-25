/** Bzzoiro / app league ids → static assets or null for generic fallback. */
const LEAGUE_ICONS: Record<number, string> = {
  27: '/logo-mundial-2026.svg',
}

export function getTournamentIconUrl(leagueId?: number | null): string | null {
  if (leagueId == null) return null
  return LEAGUE_ICONS[leagueId] ?? null
}
