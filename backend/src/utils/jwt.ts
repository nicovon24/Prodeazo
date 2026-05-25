import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET
if (!secret) throw new Error('JWT_SECRET (or SESSION_SECRET) environment variable is required')

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60

/** Claims stored in the JWT — keep small (no avatar; avatars can be multi‑MB base64). */
export interface JwtPayload {
  sub: string
  email: string
  name: string
  authProvider?: string | null
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret!, { expiresIn: SEVEN_DAYS_SECONDS, algorithm: 'HS256' })
}

export function verifyToken(token: string): JwtPayload & { iat: number; exp: number } {
  return jwt.verify(token, secret!, { algorithms: ['HS256'] }) as JwtPayload & { iat: number; exp: number }
}
