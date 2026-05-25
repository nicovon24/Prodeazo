import { db } from '../db/client'
import { predictions, users } from '../db/schema'
import { eq, isNotNull, sum } from 'drizzle-orm'

export function findLeaderboardAggregates() {
  return db
    .select({
      id: users.id,
      name: users.name,
      avatar: users.avatar,
      totalPoints: sum(predictions.points).mapWith(Number),
    })
    .from(predictions)
    .innerJoin(users, eq(predictions.userId, users.id))
    .where(isNotNull(predictions.points))
    .groupBy(users.id, users.name, users.avatar)
    .orderBy(sum(predictions.points))
}
