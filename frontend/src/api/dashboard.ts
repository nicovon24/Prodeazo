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
