import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { db } from '../db'
import { users } from '../db/schema'
import { requireAuth } from '../middlewares/auth'

const router = Router()

const BCRYPT_ROUNDS = 12

function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: maxAgeMs,
  }
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body as {
    name?: string
    email?: string
    password?: string
  }
  if (!name || !email || !password) {
    res.status(400).json({ error: 'VALIDATION_ERROR' })
    return
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing.length > 0) {
    res.status(409).json({ error: 'EMAIL_ALREADY_EXISTS' })
    return
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash })
    .returning()

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body as {
    email?: string
    password?: string
  }
  if (!email || !password) {
    res.status(400).json({ error: 'VALIDATION_ERROR' })
    return
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!user) {
    res.status(401).json({ error: 'INVALID_CREDENTIALS' })
    return
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'INVALID_CREDENTIALS' })
    return
  }

  const payload = { sub: user.id, email: user.email, role: user.role }
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: '15m',
  })
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d',
  })

  res
    .cookie('access_token', accessToken, cookieOptions(15 * 60 * 1000))
    .cookie('refresh_token', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000))
    .json({ id: user.id, name: user.name, email: user.email, role: user.role })
})

router.post('/refresh', (req, res) => {
  const token = req.cookies?.refresh_token as string | undefined
  if (!token) {
    res.status(401).json({ error: 'INVALID_REFRESH_TOKEN' })
    return
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
      sub: string
      email: string
      role: 'admin' | 'user'
    }

    const accessToken = jwt.sign(
      { sub: payload.sub, email: payload.email, role: payload.role },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '15m' }
    )
    res
      .cookie('access_token', accessToken, cookieOptions(15 * 60 * 1000))
      .json({ ok: true })
  } catch {
    res.status(401).json({ error: 'INVALID_REFRESH_TOKEN' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('access_token').clearCookie('refresh_token').json({ ok: true })
})

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user)
})

export default router
