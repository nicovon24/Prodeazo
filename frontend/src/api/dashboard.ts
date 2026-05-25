import { apiFetch } from './client'

export interface DashboardMe {
  participantCount: number
  leagueCount: number
  globalRank: number
  rankChangeWeek: number
  totalPoints: number
  scoredPredictions: number
  correctPredictions: number
  precision: number
  bestStreak: number
}

export function fetchDashboardMe(tournamentId?: string): Promise<DashboardMe> {
  const params = tournamentId ? `?tournamentId=${encodeURIComponent(tournamentId)}` : ''
  return apiFetch<DashboardMe>(`/api/dashboard/me${params}`)
}

export interface DashboardPanelTeam {
  id: number
  name: string
  shortName: string | null
  logoUrl: string | null
}

export interface DashboardPanelMatch {
  fixtureId: number
  date: string
  status: string
  round: string | null
  groupLabel: string | null
  homeTeam: DashboardPanelTeam | null
  awayTeam: DashboardPanelTeam | null
  homeScore: number | null
  awayScore: number | null
}

export interface DashboardRecentResult extends DashboardPanelMatch {
  prediction: {
    homeGoals: number
    awayGoals: number
    points: number | null
    resultTone: 'exact' | 'partial' | 'miss'
  }
}

export interface DashboardPanels {
  recentResults: DashboardRecentResult[]
  upcomingWithPrediction: DashboardPanelMatch[]
  pendingPredictions: DashboardPanelMatch[]
}

export function fetchDashboardPanels(): Promise<DashboardPanels> {
  return apiFetch<DashboardPanels>('/api/dashboard/panels')
}
