import { apiFetch } from './client'

export interface FixtureTeam {
  id: number
  name: string
  shortName: string | null
  logoUrl: string | null
}

export interface Fixture {
  id: number
  homeTeam: FixtureTeam | null
  awayTeam: FixtureTeam | null
  date: string
  round: string | null
  groupLabel: string | null
  status: string
  homeScore: number | null
  awayScore: number | null
}

export async function fetchFixtures(tournamentId?: string | null): Promise<Fixture[]> {
  const params = tournamentId ? `?tournamentId=${encodeURIComponent(tournamentId)}` : ''
  const data = await apiFetch<{ results: Fixture[] } | Fixture[]>(`/api/fixtures${params}`)
  return Array.isArray(data) ? data : data.results
}
