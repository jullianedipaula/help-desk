import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env'
import type { Role } from '../../generated/prisma'

interface JwtPayload {
  id: string
  email: string
  role: Role
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid token' })
    return
  }

  const token = header.slice(7)

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    req.user = { id: payload.id, email: payload.email, role: payload.role }
    next()
  } catch {
    res.status(401).json({ message: 'Token expired or invalid' })
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden' })
      return
    }
    next()
  }
}
