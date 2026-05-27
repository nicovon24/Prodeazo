import { db } from '../db/client'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

/** Find a single user by ID. Returns undefined if not found. */
export async function findById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return user ?? null
}

/** Find a single user by email (case-insensitive). Returns null if not found. */
export async function findByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1)
  return user ?? null
}

/** Update a user's fields by ID. Returns the updated row or null if not found. */
export async function updateById(id: string, data: Partial<typeof users.$inferInsert>) {
  const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning()
  return updated ?? null
}

/** Delete a user by ID. */
export async function deleteById(id: string) {
  await db.delete(users).where(eq(users.id, id))
}

/** Create a new user. Returns the created row. */
export async function createUser(data: {
  email: string
  name: string
  passwordHash?: string
  avatar?: string
  authProvider?: string
}) {
  const [newUser] = await db
    .insert(users)
    .values({
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash ?? null,
      avatar: data.avatar ?? null,
      authProvider: data.authProvider ?? 'local',
    })
    .returning()
  if (!newUser) throw new Error('Insert returned no user')
  return newUser
}

/** Check if a user with the given email exists. */
export async function existsByEmail(email: string): Promise<boolean> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1)
  return !!row
}
