import { apiFetch } from './client'

export interface Tournament {
  id: string
  name: string
  shortName: string | null
  leagueId: number
  isDefault: boolean
}

export interface TournamentsResponse {
  tournaments: Tournament[]
}

export function fetchTournaments(): Promise<TournamentsResponse> {
  return apiFetch<TournamentsResponse>('/api/tournaments')
}
