import '../env'
import { db, pool } from '../db/client'
import { teams, fixtures } from '../db/schema'
import { sql } from 'drizzle-orm'
import { createBzzoiroProvider, extractTeamsFromFixtures } from '../providers/bzzoiro'
import { enrichFixturesTeamsFromRoster, isLikelyBracketPlaceholder } from '../providers/participant-names'
import { dedupeTeams } from '../providers/normalize'
import { FixtureStatus } from '../constants/fixture-status'
import type { ProviderFixtureStatus } from '../providers/types'
import { normalizeBzzoiroApiKey } from '../providers/bzzoiro-token'
import { upsertTournament } from '../models/tournament.model'
import { TOURNAMENTS, type TournamentSeedConfig } from './tournaments.config'

function statusToDb(s: ProviderFixtureStatus): string {
  switch (s) {
    case 'live':
      return FixtureStatus.InProgress
    case 'finished':
      return FixtureStatus.Finished
    case 'postponed':
      return FixtureStatus.Postponed
    case 'cancelled':
      return FixtureStatus.Cancelled
    default:
      return FixtureStatus.NotStarted
  }
}

async function seedTournament(tournamentCfg: TournamentSeedConfig, apiKey: string, base: string, tz: string) {
  console.log(`\n=== Seeding "${tournamentCfg.name}" ===`)

  const provider = createBzzoiroProvider({ apiKey, baseUrl: base, timezone: tz })
  const config = { kind: 'season' as const, seasonId: tournamentCfg.seasonId, leagueId: tournamentCfg.leagueId, apiKey }

  let fixturesData: Awaited<ReturnType<typeof provider.listFixtures>>
  let fetchedSeasonIds: string[] = []

  console.log(`Fetching fixtures for season ${config.seasonId} (league ${config.leagueId})…`)
  fixturesData = await provider.listFixtures({ seasonId: config.seasonId })
  fetchedSeasonIds = [config.seasonId]

  const leagueIdForRoster = config.leagueId

  let rosterFull: Awaited<ReturnType<typeof provider.listTeams>> = []
  if (leagueIdForRoster) {
    rosterFull = await provider.listTeams({
      leagueId: leagueIdForRoster,
      inCompetition: true,
      v2Limit: Number(process.env.BZZOIRO_V2_TEAMS_LIMIT) || 1000,
    })
    fixturesData = enrichFixturesTeamsFromRoster(fixturesData, rosterFull)
  }

  if (fixturesData.length === 0) {
    console.warn(`No events for season ${config.seasonId}. Check seasonId in tournaments.config.ts.`)
  }

  const fromFixtures = extractTeamsFromFixtures(fixturesData)
  const nationsWithCountry = rosterFull.filter((t) => Boolean(t.country?.trim()))
  const teamEntities = dedupeTeams([...fromFixtures, ...nationsWithCountry])
  if (nationsWithCountry.length > 0) {
    console.log(
      `[seed] Merged ${nationsWithCountry.length} teams with country from v2 roster + ${fromFixtures.length} sides from fixtures → ${teamEntities.length} unique teams in DB.`
    )
  }
  const placeholderCount = teamEntities.filter((t) => isLikelyBracketPlaceholder(t.name)).length
  if (placeholderCount > 0 && teamEntities.length > 0 && placeholderCount >= Math.ceil(teamEntities.length * 0.25)) {
    console.warn(
      `[seed] ${placeholderCount}/${teamEntities.length} sides look like bracket placeholders (e.g. 1A, W73, 3C/3E/…), not final country names. ` +
        'Bzzoiro models undecided World Cup slots as synthetic "teams"; after the draw / when events show real nations, run seed again.'
    )
  }
  console.log(`Seeding ${teamEntities.length} teams…`)

  for (const team of teamEntities) {
    const id = Number.parseInt(team.id, 10)
    if (!Number.isFinite(id)) throw new Error(`Unexpected non-numeric team id: ${team.id}`)

    await db
      .insert(teams)
      .values({
        id,
        name: team.name,
        shortName: team.shortName ?? null,
        logoUrl: team.logoUrl ?? null,
        groupLabel: null,
      })
      .onConflictDoNothing()

    console.log(`  ${team.name}`)
  }

  // Upsert the tournament record
  const leagueIdNum = Number.parseInt(leagueIdForRoster || '0', 10)
  const seasonIdsCsv = fetchedSeasonIds.join(',')
  console.log(`Upserting tournament "${tournamentCfg.name}"…`)
  const tournament = await upsertTournament({
    name: tournamentCfg.name,
    shortName: tournamentCfg.shortName,
    leagueId: leagueIdNum,
    seasonIds: seasonIdsCsv,
    isDefault: tournamentCfg.isDefault,
  })
  console.log(`  → tournament id: ${tournament.id}`)

  console.log('Seeding fixtures…')
  for (const fx of fixturesData) {
    const fid = Number.parseInt(fx.id, 10)
    const homeId = Number.parseInt(fx.homeTeam.id, 10)
    const awayId = Number.parseInt(fx.awayTeam.id, 10)
    if (![fid, homeId, awayId].every(Number.isFinite)) {
      console.warn(`  Skip fixture ${fx.id} (non-numeric ids)`)
      continue
    }

    const lid =
      fx.leagueId !== undefined && fx.leagueId !== null && fx.leagueId !== ''
        ? Number.parseInt(String(fx.leagueId), 10)
        : NaN
    const sid =
      fx.seasonId !== undefined && fx.seasonId !== null && fx.seasonId !== ''
        ? Number.parseInt(String(fx.seasonId), 10)
        : NaN

    await db
      .insert(fixtures)
      .values({
        id: fid,
        homeTeamId: homeId,
        awayTeamId: awayId,
        date: new Date(fx.kickoffAt),
        round: fx.phase ?? null,
        roundNumber: fx.roundNumber ?? null,
        groupLabel: fx.groupLabel ?? null,
        leagueId: Number.isFinite(lid) ? lid : null,
        seasonId: Number.isFinite(sid) ? sid : null,
        status: statusToDb(fx.status),
        homeScore: fx.homeScore ?? null,
        awayScore: fx.awayScore ?? null,
        tournamentId: tournament.id,
      })
      .onConflictDoUpdate({
        target: fixtures.id,
        set: { tournamentId: tournament.id, status: statusToDb(fx.status), homeScore: fx.homeScore ?? null, awayScore: fx.awayScore ?? null },
      })
  }

  console.log(`Seed complete for "${tournamentCfg.name}".`)
}

async function main() {
  const apiKey = normalizeBzzoiroApiKey(process.env.BZZOIRO_API_KEY ?? '')
  if (!apiKey) throw new Error('Missing BZZOIRO_API_KEY — add it to backend/.env')
  const tz = process.env.BSD_TIMEZONE ?? 'UTC'
  const base = (process.env.BZZOIRO_BASE_URL ?? 'https://sports.bzzoiro.com/api').replace(/\/+$/, '')

  console.log(`Bzzoiro: API token loaded (${apiKey.length} chars).`)
  console.log(`Seeding ${TOURNAMENTS.length} tournament(s)…`)

  try {
    for (const t of TOURNAMENTS) {
      await seedTournament(t, apiKey, base, tz)
    }
    console.log('\nAll tournaments seeded successfully.')
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  } finally {
    await pool.end().catch(() => {})
  }
}

main()
