import { db } from '../db/client'
import { passwordResetTokens } from '../db/schema'
import { and, eq, gt, isNull } from 'drizzle-orm'

/** Create a new reset token valid for 1 hour. */
export async function createResetToken(userId: string) {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
  const [row] = await db
    .insert(passwordResetTokens)
    .values({ userId, expiresAt })
    .returning()
  return row
}

/** Find a token that is not expired and not yet used. */
export async function findValidToken(token: string) {
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt)
      )
    )
    .limit(1)
  return row ?? null
}

/** Mark a token as used (single-use enforcement). */
export async function markTokenUsed(id: string) {
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, id))
}

/** Invalidate all previous unused tokens for a user before issuing a new one. */
export async function invalidatePreviousTokens(userId: string) {
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.userId, userId),
        isNull(passwordResetTokens.usedAt)
      )
    )
}

/**
 * Atomically consume a valid token.
 * Marks it as used in a single UPDATE with all validity conditions in the WHERE clause.
 * Returns the userId on success, or null if the token was already used, expired, or not found.
 * This eliminates the TOCTOU race present in findValidToken + markTokenUsed.
 */
export async function consumeToken(token: string): Promise<{ userId: string } | null> {
  const [row] = await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt)
      )
    )
    .returning({ userId: passwordResetTokens.userId })
  return row ?? null
}
