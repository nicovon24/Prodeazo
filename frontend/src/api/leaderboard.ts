import { apiFetch } from './client'

export interface LeaderboardEntry {
  id: string
  name: string
  avatar: string | null
  totalPoints: number
}

export interface LeaderboardPaginatedResponse {
  count: number
  results: LeaderboardEntry[]
  next: string | null
  previous: string | null
}

export interface MyLeaderboardStats {
  totalPoints: number
  scoredPredictions: number
  correctPredictions: number
  precision: number
  globalRank: number
}

export function fetchLeaderboard(page?: number, limit?: number): Promise<LeaderboardPaginatedResponse> {
  const params = new URLSearchParams()
  if (page) params.set('page', String(page))
  if (limit) params.set('limit', String(limit))
  const query = params.toString() ? `?${params}` : ''
  return apiFetch<LeaderboardPaginatedResponse>(`/api/leaderboard${query}`)
}

export function fetchMyLeaderboardStats(): Promise<MyLeaderboardStats> {
  return apiFetch<MyLeaderboardStats>('/api/leaderboard/me')
}

export interface PointsHistoryEntry {
  day: string       // ISO date string (day truncated)
  cumulative: number
}

export function fetchMyPointsHistory(): Promise<{ results: PointsHistoryEntry[] }> {
  return apiFetch<{ results: PointsHistoryEntry[] }>('/api/leaderboard/me/history')
}
