import { apiFetch } from './client'

export interface Prediction {
  id: string
  fixtureId: number
  homeGoals: number
  awayGoals: number
}

export async function fetchPredictions(tournamentId?: string | null): Promise<Prediction[]> {
  const params = tournamentId ? `?tournamentId=${encodeURIComponent(tournamentId)}` : ''
  const data = await apiFetch<{ results: Prediction[] } | Prediction[]>(`/api/predictions${params}`)
  return Array.isArray(data) ? data : data.results
}

export function savePrediction(fixtureId: number, homeGoals: number, awayGoals: number): Promise<void> {
  return apiFetch('/api/predictions', {
    method: 'POST',
    body: JSON.stringify({ fixtureId, homeGoals, awayGoals }),
  })
}
