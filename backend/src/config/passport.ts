import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import type { Profile } from 'passport-google-oauth20'
import { Strategy as LocalStrategy } from 'passport-local'
import bcrypt from 'bcrypt'
import { db } from '../db/client'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim()
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()

/** Set when real Google OAuth credentials exist (not placeholders). */
export const isGoogleOAuthEnabled = Boolean(googleClientId && googleClientSecret)

if (googleClientId && googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/callback',
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (err?: Error | null, user?: Express.User | false) => void
      ) => {
        try {
          const existing = await db
            .select()
            .from(users)
            .where(eq(users.googleId, profile.id))
            .limit(1)

          if (existing.length > 0) {
            return done(null, existing[0])
          }

          const email = profile.emails?.[0]?.value || `google_${profile.id}@noemail.invalid`

          // If a local account with the same email exists, link it to Google
          const [byEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1)
          if (byEmail) {
            const [updated] = await db
              .update(users)
              .set({ googleId: profile.id, avatar: byEmail.avatar ?? profile.photos?.[0]?.value, authProvider: 'google' })
              .where(eq(users.id, byEmail.id))
              .returning()
            return done(null, updated)
          }

          const [newUser] = await db
            .insert(users)
            .values({
              googleId: profile.id,
              email,
              name: profile.displayName,
              avatar: profile.photos?.[0]?.value,
            })
            .returning()

          done(null, newUser)
        } catch (err) {
          done(err as Error)
        }
      }
    )
  )
}

passport.use(
  'local',
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
      if (!user || !user.passwordHash) return done(null, false)
      const match = await bcrypt.compare(password, user.passwordHash)
      if (!match) return done(null, false)
      done(null, user)
    } catch (err) {
      done(err as Error)
    }
  })
)

passport.serializeUser((user: any, done) => done(null, user.id))

passport.deserializeUser(async (id: string, done) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
    done(null, user ?? null)
  } catch (err) {
    done(err)
  }
})

export default passport
