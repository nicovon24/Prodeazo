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
    name: 'Premier League 2025/26',
    shortName: 'PL2526',
    leagueId: '1',
    seasonId: '337',
    isDefault: false,
  },
]
