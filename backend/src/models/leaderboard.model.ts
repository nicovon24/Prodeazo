import { db } from '../db/client'
import { predictions, users, fixtures } from '../db/schema'
import { desc, eq, isNotNull, sum, sql, and } from 'drizzle-orm'

/**
 * Returns all registered users with their total scored points (defaulting to 0).
 * Uses LEFT JOIN so users with no scored predictions still appear in the ranking.
 */
export function findLeaderboardAggregates() {
  return db
    .select({
      id: users.id,
      name: users.name,
      avatar: users.avatar,
      totalPoints: sql<number>`COALESCE(${sum(predictions.points)}, 0)`,
    })
    .from(users)
    .leftJoin(
      predictions,
      and(eq(predictions.userId, users.id), isNotNull(predictions.points))
    )
    .groupBy(users.id, users.name, users.avatar)
    .orderBy(desc(sql`COALESCE(${sum(predictions.points)}, 0)`))
}

/**
 * Returns daily point totals for a user, ordered by match date ASC.
 * Each row: { day: Date, dayPoints: number }
 * The caller accumulates them into a running total for the chart.
 */
export async function findUserPointsHistory(userId: string) {
  const rows = await db
    .select({
      day: sql<string>`DATE_TRUNC('day', ${fixtures.date})`.as('day'),
      dayPoints: sum(predictions.points).mapWith(Number),
    })
    .from(predictions)
    .innerJoin(fixtures, eq(predictions.fixtureId, fixtures.id))
    .where(
      sql`${predictions.userId} = ${userId} AND ${predictions.points} IS NOT NULL`
    )
    .groupBy(sql`DATE_TRUNC('day', ${fixtures.date})`)
    .orderBy(sql`DATE_TRUNC('day', ${fixtures.date}) ASC`)

  // Compute cumulative sum
  let running = 0
  return rows.map((r) => {
    running += r.dayPoints ?? 0
    return { day: r.day, cumulative: running }
  })
}
