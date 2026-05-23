import '../env'
import { ProviderHttpClient } from '../providers/http'
import { bzzoiroAuthorizationValue, normalizeBzzoiroApiKey } from '../providers/bzzoiro-token'

function baseUrl(): string {
  return (process.env.BZZOIRO_BASE_URL ?? 'https://sports.bzzoiro.com/api').replace(/\/+$/, '')
}

function createClient(): ProviderHttpClient {
  const raw = process.env.BZZOIRO_API_KEY ?? ''
  const apiKey = normalizeBzzoiroApiKey(raw)
  if (!apiKey) throw new Error('Missing BZZOIRO_API_KEY')
  return new ProviderHttpClient({
    baseUrl: baseUrl(),
    headers: {
      Authorization: bzzoiroAuthorizationValue(apiKey),
      Accept: 'application/json',
    },
  })
}

export type FixtureTeamLabels = { homeTeam: string; awayTeam: string }

/**
 * Map event id → display strings from BSD v2 list (`home_team` / `away_team`).
 * Use when Postgres still has bracket placeholder names per team id but API already shows nations.
 */
function collectFixtureLabels(rows: Record<string, unknown>[]): Map<number, FixtureTeamLabels> {
  const map = new Map<number, FixtureTeamLabels>()
  for (const row of rows) {
    const rawId = row.id
    const id =
      typeof rawId === 'number'
        ? rawId
        : typeof rawId === 'string'
          ? Number.parseInt(rawId, 10)
          : NaN
    if (!Number.isFinite(id)) continue
    const ht = row.home_team
    const at = row.away_team
    if (typeof ht !== 'string' || typeof at !== 'string') continue
    const homeTeam = ht.trim()
    const awayTeam = at.trim()
    if (!homeTeam || !awayTeam) continue
    map.set(id, { homeTeam, awayTeam })
  }
  return map
}

export async function fetchEventTeamLabelsForSeason(seasonId: number): Promise<Map<number, FixtureTeamLabels>> {
  const rows = await createClient().getAllPages<Record<string, unknown>>(
    '/v2/events/',
    { season_id: seasonId, limit: 200 },
    { usePageQuery: false, maxPages: 100 }
  )
  return collectFixtureLabels(rows)
}

/** All events under a league (every season): fixes overlay when group stage uses another `season_id` than knockout. */
export async function fetchEventTeamLabelsForLeague(leagueId: number): Promise<Map<number, FixtureTeamLabels>> {
  const rows = await createClient().getAllPages<Record<string, unknown>>(
    '/v2/events/',
    { league_id: leagueId, limit: 200 },
    { usePageQuery: false, maxPages: 150 }
  )
  return collectFixtureLabels(rows)
}

/** Fetch scores for today's date — used by score sync job. */
export async function fetchScoresForDate(dateISO: string): Promise<Record<string, unknown>[]> {
  return createClient().getAllPages<Record<string, unknown>>(
    '/v2/events/',
    { date_from: dateISO, date_to: dateISO, limit: 200 },
    { usePageQuery: false, maxPages: 50 }
  )
}

/** In-play matches via v2 (replaces deprecated GET /live/). */
export async function fetchLiveScores() {
  const rows = await createClient().getAllPages<unknown>(
    '/v2/events/',
    { status: 'inprogress', limit: 200 },
    { usePageQuery: false, maxPages: 15 }
  )
  return { results: rows }
}

/**
 * League table for a season.
 */
export async function fetchStandings(leagueId: number, seasonId?: number) {
  return createClient().get<unknown>(
    `/v2/leagues/${leagueId}/standings/`,
    seasonId !== undefined && Number.isFinite(seasonId) ? { season_id: seasonId } : {}
  )
}
