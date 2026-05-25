import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } })
  }

  const token = authHeader.slice(7)
  try {
    const payload = verifyToken(token)
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      avatar: payload.avatar,
      authProvider: payload.authProvider,
    }
    next()
  } catch {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } })
  }
}
