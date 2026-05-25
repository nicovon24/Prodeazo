import { db } from '../db/client'
import { fixtures, predictions, teams } from '../db/schema'
import { FixtureStatus } from '../constants/fixture-status'
import { and, eq, inArray, isNull, desc, asc } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

const homeTeam = alias(teams, 'home_team')
const awayTeam = alias(teams, 'away_team')

const FINISHED_STATUSES = [FixtureStatus.Finished, 'ft'] as const
const UPCOMING_STATUSES = [FixtureStatus.NotStarted, 'ns'] as const
const ACTIVE_WITH_PRED_STATUSES = [
  FixtureStatus.InProgress,
  FixtureStatus.NotStarted,
  'inprogress',
  'ns',
] as const

type PanelRow = {
  fixtureId: number
  date: Date
  status: string | null
  round: string | null
  groupLabel: string | null
  homeScore: number | null
  awayScore: number | null
  homeTeamId: number | null
  awayTeamId: number | null
  homeTeamName: string | null
  awayTeamName: string | null
  homeTeamShortName: string | null
  awayTeamShortName: string | null
  homeTeamLogoUrl: string | null
  awayTeamLogoUrl: string | null
  homeGoals: number
  awayGoals: number
  points: number | null
}

function baseSelect() {
  return {
    fixtureId: fixtures.id,
    date: fixtures.date,
    status: fixtures.status,
    round: fixtures.round,
    groupLabel: fixtures.groupLabel,
    homeScore: fixtures.homeScore,
    awayScore: fixtures.awayScore,
    homeTeamId: fixtures.homeTeamId,
    awayTeamId: fixtures.awayTeamId,
    homeTeamName: homeTeam.name,
    awayTeamName: awayTeam.name,
    homeTeamShortName: homeTeam.shortName,
    awayTeamShortName: awayTeam.shortName,
    homeTeamLogoUrl: homeTeam.logoUrl,
    awayTeamLogoUrl: awayTeam.logoUrl,
    homeGoals: predictions.homeGoals,
    awayGoals: predictions.awayGoals,
    points: predictions.points,
  }
}

export async function findUserRecentFinishedPredictions(
  userId: string,
  limit = 5
): Promise<PanelRow[]> {
  return db
    .select(baseSelect())
    .from(predictions)
    .innerJoin(fixtures, eq(predictions.fixtureId, fixtures.id))
    .leftJoin(homeTeam, eq(fixtures.homeTeamId, homeTeam.id))
    .leftJoin(awayTeam, eq(fixtures.awayTeamId, awayTeam.id))
    .where(
      and(
        eq(predictions.userId, userId),
        inArray(fixtures.status, [...FINISHED_STATUSES])
      )
    )
    .orderBy(desc(fixtures.date))
    .limit(limit)
}

export async function findUserUpcomingPredictedFixtures(userId: string): Promise<PanelRow[]> {
  const rows = await db
    .select(baseSelect())
    .from(predictions)
    .innerJoin(fixtures, eq(predictions.fixtureId, fixtures.id))
    .leftJoin(homeTeam, eq(fixtures.homeTeamId, homeTeam.id))
    .leftJoin(awayTeam, eq(fixtures.awayTeamId, awayTeam.id))
    .where(
      and(
        eq(predictions.userId, userId),
        inArray(fixtures.status, [...ACTIVE_WITH_PRED_STATUSES])
      )
    )

  return rows
    .sort((a, b) => {
      const aLive = a.status === FixtureStatus.InProgress || a.status === 'inprogress'
      const bLive = b.status === FixtureStatus.InProgress || b.status === 'inprogress'
      if (aLive && !bLive) return -1
      if (bLive && !aLive) return 1
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
    .slice(0, 3)
}

export async function findUserPendingFixtures(userId: string, limit = 5): Promise<Omit<PanelRow, 'homeGoals' | 'awayGoals' | 'points'>[]> {
  const rows = await db
    .select({
      fixtureId: fixtures.id,
      date: fixtures.date,
      status: fixtures.status,
      round: fixtures.round,
      groupLabel: fixtures.groupLabel,
      homeScore: fixtures.homeScore,
      awayScore: fixtures.awayScore,
      homeTeamId: fixtures.homeTeamId,
      awayTeamId: fixtures.awayTeamId,
      homeTeamName: homeTeam.name,
      awayTeamName: awayTeam.name,
      homeTeamShortName: homeTeam.shortName,
      awayTeamShortName: awayTeam.shortName,
      homeTeamLogoUrl: homeTeam.logoUrl,
      awayTeamLogoUrl: awayTeam.logoUrl,
    })
    .from(fixtures)
    .leftJoin(homeTeam, eq(fixtures.homeTeamId, homeTeam.id))
    .leftJoin(awayTeam, eq(fixtures.awayTeamId, awayTeam.id))
    .leftJoin(
      predictions,
      and(eq(predictions.fixtureId, fixtures.id), eq(predictions.userId, userId))
    )
    .where(and(inArray(fixtures.status, [...UPCOMING_STATUSES]), isNull(predictions.id)))
    .orderBy(asc(fixtures.date))
    .limit(limit)

  return rows
}
