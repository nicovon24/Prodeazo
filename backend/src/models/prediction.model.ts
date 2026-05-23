import { db } from '../db/client'
import { predictions, fixtures } from '../db/schema'
import { and, eq } from 'drizzle-orm'

export function findPredictionsByUserId(userId: string) {
  return db.select().from(predictions).where(eq(predictions.userId, userId))
}

export function findPredictionsByUserIdAndTournament(userId: string, tournamentId: string) {
  return db
    .select({
      id: predictions.id,
      userId: predictions.userId,
      fixtureId: predictions.fixtureId,
      homeGoals: predictions.homeGoals,
      awayGoals: predictions.awayGoals,
      points: predictions.points,
      createdAt: predictions.createdAt,
    })
    .from(predictions)
    .innerJoin(fixtures, eq(predictions.fixtureId, fixtures.id))
    .where(and(eq(predictions.userId, userId), eq(fixtures.tournamentId, tournamentId)))
}

export function findPredictionByUserAndFixture(userId: string, fixtureId: number) {
  return db
    .select()
    .from(predictions)
    .where(and(eq(predictions.userId, userId), eq(predictions.fixtureId, fixtureId)))
    .limit(1)
}

export function updatePredictionGoals(
  userId: string,
  fixtureId: number,
  homeGoals: number,
  awayGoals: number
) {
  return db
    .update(predictions)
    .set({ homeGoals, awayGoals })
    .where(and(eq(predictions.userId, userId), eq(predictions.fixtureId, fixtureId)))
    .returning()
}

export function upsertPrediction(
  userId: string,
  fixtureId: number,
  homeGoals: number,
  awayGoals: number
) {
  return db
    .insert(predictions)
    .values({ userId, fixtureId, homeGoals, awayGoals })
    .onConflictDoUpdate({
      target: [predictions.userId, predictions.fixtureId],
      set: { homeGoals, awayGoals },
    })
    .returning()
}
