import type { Request, Response } from 'express'
import { paginate } from '../utils/paginate'
import { getCache, setCache } from '../services/cache.service'
import {
  fetchLiveScores,
  fetchStandings,
  fetchEventTeamLabelsForSeason,
  fetchEventTeamLabelsForLeague,
  type FixtureTeamLabels,
} from '../services/bzzoiro.service'
import { isLikelyBracketPlaceholder } from '../providers/participant-names'
import * as fixtureModel from '../models/fixture.model'
import { resolveTournament } from '../utils/resolveTournament'
import { err } from '../utils/apiError'

type FixtureLabelCacheEntry = [number, FixtureTeamLabels]

const LABEL_CACHE_TTL_SEC = Number(process.env.FIXTURE_TEAM_LABELS_CACHE_TTL_SEC) || 300

type FixtureListRow = Awaited<ReturnType<typeof fixtureModel.findFixturesWithTeams>>[number]

/** Shape expected by web clients (`homeTeam` / `awayTeam` objects). */
function toFixtureApiRow(row: FixtureListRow) {
  return {
    id: row.id,
    date: row.date,
    round: row.round,
    groupLabel: row.groupLabel,
    status: row.status,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    homeTeam:
      row.homeTeamId != null
        ? {
            id: row.homeTeamId,
            name: row.homeTeamName,
            shortName: row.homeTeamShortName,
            logoUrl: row.homeTeamLogoUrl,
          }
        : null,
    awayTeam:
      row.awayTeamId != null
        ? {
            id: row.awayTeamId,
            name: row.awayTeamName,
            shortName: row.awayTeamShortName,
            logoUrl: row.awayTeamLogoUrl,
          }
        : null,
  }
}

function resolveTournamentQueryParam(raw: unknown): string | undefined {
  if (Array.isArray(raw)) return raw[0] as string | undefined
  return raw as string | undefined
}

export async function list(req: Request, res: Response) {
  const tournamentId = resolveTournamentQueryParam(req.query.tournamentId)
  const tournament = await resolveTournament(tournamentId)
  if (!tournament) {
    return res.status(404).json(err('NOT_FOUND', 'Tournament not found'))
  }

  const rows = await fixtureModel.findFixturesWithTeams(tournament.id)

  const leagueNum = Number.isFinite(tournament.leagueId) ? tournament.leagueId : NaN
  // Parse season ids from tournament.seasonIds (CSV), use first one
  const firstSeasonId = tournament.seasonIds.split(',')[0]?.trim()
  const seasonId = firstSeasonId ? Number(firstSeasonId) : NaN

  let out: FixtureListRow[] = rows
  const needsOverlay =
    rows.length > 0 &&
    rows.some(
      (r) =>
        isLikelyBracketPlaceholder(r.homeTeamName ?? undefined) ||
        isLikelyBracketPlaceholder(r.awayTeamName ?? undefined)
    )

  if (needsOverlay && (Number.isFinite(leagueNum) || Number.isFinite(seasonId))) {
    try {
      const cacheKey = Number.isFinite(leagueNum)
        ? `fixture_team_labels:${tournament.id}:league:${leagueNum}`
        : `fixture_team_labels:${tournament.id}:season:${seasonId}`
      let entries = await getCache<FixtureLabelCacheEntry[]>(cacheKey)
      let labelMap: Map<number, FixtureTeamLabels>
      if (entries?.length) {
        labelMap = new Map(entries)
      } else {
        labelMap = Number.isFinite(leagueNum)
          ? await fetchEventTeamLabelsForLeague(leagueNum)
          : await fetchEventTeamLabelsForSeason(seasonId)
        await setCache(cacheKey, [...labelMap.entries()] as FixtureLabelCacheEntry[], LABEL_CACHE_TTL_SEC)
      }

      out = rows.map((r) => {
        const l = labelMap.get(r.id)
        if (!l) return r
        let homeTeamName = r.homeTeamName
        let awayTeamName = r.awayTeamName
        if (isLikelyBracketPlaceholder(homeTeamName ?? undefined) && !isLikelyBracketPlaceholder(l.homeTeam))
          homeTeamName = l.homeTeam
        if (isLikelyBracketPlaceholder(awayTeamName ?? undefined) && !isLikelyBracketPlaceholder(l.awayTeam))
          awayTeamName = l.awayTeam
        return { ...r, homeTeamName, awayTeamName }
      })
    } catch {
      out = rows
    }
  }

  res.json(paginate(out.map(toFixtureApiRow), req))
}

export async function live(req: Request, res: Response) {
  const tournamentId = resolveTournamentQueryParam(req.query.tournamentId)
  const tournament = await resolveTournament(tournamentId)
  if (!tournament) {
    return res.status(404).json(err('NOT_FOUND', 'Tournament not found'))
  }
  const cacheKey = `live:${tournament.id}`
  const cached = await getCache<unknown[]>(cacheKey)
  if (cached) return res.json(paginate(cached, req))

  const data = await fetchLiveScores()
  const rows = data.results
  await setCache(cacheKey, rows, 60)
  res.json(paginate(rows, req))
}

export async function standings(req: Request, res: Response) {
  const tournamentId = resolveTournamentQueryParam(req.query.tournamentId)
  const tournament = await resolveTournament(tournamentId)
  if (!tournament) {
    return res.status(404).json(err('NOT_FOUND', 'Tournament not found'))
  }

  const cacheKey = `standings:${tournament.id}`
  const cached = await getCache<unknown[]>(cacheKey)
  if (cached) return res.json(paginate(cached, req))

  const seasonId = tournament.seasonIds ? Number(tournament.seasonIds.split(',')[0]) : undefined
  const data = await fetchStandings(tournament.leagueId, Number.isFinite(seasonId) ? seasonId : undefined)
  await setCache(cacheKey, data, 900)
  res.json(paginate(Array.isArray(data) ? data : [data], req))
}
