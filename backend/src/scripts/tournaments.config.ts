export interface TournamentSeedConfig {
  name: string
  shortName?: string
  leagueId: string
  seasonId: string
  isDefault: boolean
}

export const TOURNAMENTS: TournamentSeedConfig[] = [
  {
    name: 'FIFA World Cup 2026',
    shortName: 'WC2026',
    leagueId: '27',
    seasonId: '188',
    isDefault: true,
  },
  {
    name: 'Brasileirão Serie A 2026',
    shortName: 'BSA',
    leagueId: '9',
    seasonId: '28',
    isDefault: false,
  },
  {
    name: 'UEFA Champions League 2025/26',
    shortName: 'UCL',
    leagueId: '7',
    seasonId: '268',
    isDefault: false,
  },
]
