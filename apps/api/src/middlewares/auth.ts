import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

interface TokenPayload {
  sub: string
  email: string
  role: 'admin' | 'user'
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.access_token as string | undefined
  if (!token) {
    res.status(401).json({ error: 'TOKEN_EXPIRED' })
    return
  }
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!
    ) as TokenPayload
    req.user = { id: payload.sub, email: payload.email, role: payload.role }
    next()
  } catch {
    res.status(401).json({ error: 'TOKEN_EXPIRED' })
  }
}

export function requireRole(role: 'admin' | 'user') {
  return function (req: Request, res: Response, next: NextFunction) {
    requireAuth(req, res, () => {
      if (req.user?.role !== role) {
        res.status(403).json({ error: 'FORBIDDEN' })
        return
      }
      next()
    })
  }
}
