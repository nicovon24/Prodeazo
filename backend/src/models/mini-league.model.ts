import { db } from '../db/client'
import { miniLeagues, miniLeagueMembers, predictions, users } from '../db/schema'
import { eq, and, sum, isNotNull, gt } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

export function findLeagueById(id: string) {
  return db.select().from(miniLeagues).where(eq(miniLeagues.id, id)).limit(1)
}

export function findLeagueByInviteCode(code: string) {
  return db
    .select()
    .from(miniLeagues)
    .where(eq(miniLeagues.inviteCode, code.toUpperCase()))
    .limit(1)
}

export function findLeaguesByUserId(userId: string) {
  return db
    .select({ league: miniLeagues, role: miniLeagueMembers.role })
    .from(miniLeagueMembers)
    .innerJoin(miniLeagues, eq(miniLeagueMembers.leagueId, miniLeagues.id))
    .where(eq(miniLeagueMembers.userId, userId))
}

export function insertLeague(name: string, creatorId: string) {
  return db.insert(miniLeagues).values({ name, creatorId }).returning()
}

export function insertMember(leagueId: string, userId: string, role: 'owner' | 'member' = 'member') {
  return db.insert(miniLeagueMembers).values({ leagueId, userId, role }).returning()
}

export function findMember(leagueId: string, userId: string) {
  return db
    .select()
    .from(miniLeagueMembers)
    .where(and(eq(miniLeagueMembers.leagueId, leagueId), eq(miniLeagueMembers.userId, userId)))
    .limit(1)
}

export function findMembersByLeagueId(leagueId: string) {
  return db
    .select({ id: users.id, name: users.name, avatar: users.avatar, role: miniLeagueMembers.role })
    .from(miniLeagueMembers)
    .innerJoin(users, eq(miniLeagueMembers.userId, users.id))
    .where(eq(miniLeagueMembers.leagueId, leagueId))
}

export function deleteMember(leagueId: string, userId: string) {
  return db
    .delete(miniLeagueMembers)
    .where(and(eq(miniLeagueMembers.leagueId, leagueId), eq(miniLeagueMembers.userId, userId)))
    .returning()
}

export async function deleteLeague(leagueId: string) {
  return db.transaction(async (tx) => {
    await tx.delete(miniLeagueMembers).where(eq(miniLeagueMembers.leagueId, leagueId))
    const [deleted] = await tx.delete(miniLeagues).where(eq(miniLeagues.id, leagueId)).returning()
    return deleted
  })
}

export function generateInviteToken(leagueId: string) {
  const token = createId()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  return db
    .update(miniLeagues)
    .set({ inviteToken: token, inviteExpiresAt: expiresAt })
    .where(eq(miniLeagues.id, leagueId))
    .returning()
}

export function findLeagueByToken(token: string) {
  return db
    .select()
    .from(miniLeagues)
    .where(and(eq(miniLeagues.inviteToken, token), gt(miniLeagues.inviteExpiresAt, new Date())))
    .limit(1)
}

export function findLeagueLeaderboard(leagueId: string) {
  return db
    .select({
      id: users.id,
      name: users.name,
      avatar: users.avatar,
      totalPoints: sum(predictions.points).mapWith(Number),
    })
    .from(miniLeagueMembers)
    .innerJoin(users, eq(miniLeagueMembers.userId, users.id))
    .leftJoin(predictions, and(eq(predictions.userId, users.id), isNotNull(predictions.points)))
    .where(eq(miniLeagueMembers.leagueId, leagueId))
    .groupBy(users.id, users.name, users.avatar)
}
