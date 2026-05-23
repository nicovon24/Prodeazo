import { db } from '../db/client'
import { tournaments } from '../db/schema'
import { eq, and } from 'drizzle-orm'

export async function findDefaultTournament() {
  const [t] = await db.select().from(tournaments).where(eq(tournaments.isDefault, true)).limit(1)
  return t ?? null
}

export async function findTournamentById(id: string) {
  const [t] = await db.select().from(tournaments).where(eq(tournaments.id, id)).limit(1)
  return t ?? null
}

export async function findActiveTournaments() {
  return db.select().from(tournaments).where(eq(tournaments.active, true))
}

export async function upsertTournament(data: {
  name: string
  shortName?: string
  leagueId: number
  seasonIds: string
  isDefault: boolean
}) {
  const existing = await db
    .select()
    .from(tournaments)
    .where(and(eq(tournaments.leagueId, data.leagueId), eq(tournaments.seasonIds, data.seasonIds)))
    .limit(1)

  if (existing.length > 0) {
    const [updated] = await db
      .update(tournaments)
      .set({ name: data.name, shortName: data.shortName, seasonIds: data.seasonIds, isDefault: data.isDefault, active: true })
      .where(eq(tournaments.id, existing[0].id))
      .returning()
    return updated
  }

  const [created] = await db.insert(tournaments).values({ ...data, active: true }).returning()
  return created
}
