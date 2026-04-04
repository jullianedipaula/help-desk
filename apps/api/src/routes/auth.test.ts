import cookieParser from 'cookie-parser'
import express from 'express'
import supertest from 'supertest'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
})

vi.mock('../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}))

import { db } from '../db'
import authRouter from './auth'

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/auth', authRouter)
  return app
}

function mockSelectEmpty() {
  vi.mocked(db.select).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      }),
    }),
  } as any)
}

function mockSelectUser(user: object) {
  vi.mocked(db.select).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([user]),
      }),
    }),
  } as any)
}

function mockInsertUser(user: object) {
  vi.mocked(db.insert).mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([user]),
    }),
  } as any)
}

describe('POST /auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when body fields are missing', async () => {
    const res = await supertest(buildApp())
      .post('/auth/register')
      .send({ email: 'alice@test.com' })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'VALIDATION_ERROR' })
  })

  it('returns 409 when email already exists', async () => {
    mockSelectUser({ id: 'existing', email: 'alice@test.com' })
    const res = await supertest(buildApp())
      .post('/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' })
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: 'EMAIL_ALREADY_EXISTS' })
  })

  it('creates a user and returns 201 with user data (no password)', async () => {
    mockSelectEmpty()
    mockInsertUser({
      id: 'new-user-id',
      name: 'Alice',
      email: 'alice@test.com',
      role: 'user',
    })
    const res = await supertest(buildApp())
      .post('/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      id: 'new-user-id',
      name: 'Alice',
      email: 'alice@test.com',
      role: 'user',
    })
    expect(res.body.password).toBeUndefined()
    expect(res.body.passwordHash).toBeUndefined()
  })
})

describe('POST /auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when body fields are missing', async () => {
    const res = await supertest(buildApp())
      .post('/auth/login')
      .send({ email: 'alice@test.com' })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'VALIDATION_ERROR' })
  })

  it('returns 401 when email does not exist', async () => {
    mockSelectEmpty()
    const res = await supertest(buildApp())
      .post('/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' })
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'INVALID_CREDENTIALS' })
  })

  it('returns 401 when password is wrong', async () => {
    const bcrypt = await import('bcrypt')
    const passwordHash = await bcrypt.hash('correctpassword', 1)
    mockSelectUser({
      id: 'user-id',
      name: 'Alice',
      email: 'alice@test.com',
      passwordHash,
      role: 'user',
    })
    const res = await supertest(buildApp())
      .post('/auth/login')
      .send({ email: 'alice@test.com', password: 'wrongpassword' })
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'INVALID_CREDENTIALS' })
  })

  it('sets access_token and refresh_token cookies on success', async () => {
    const bcrypt = await import('bcrypt')
    const passwordHash = await bcrypt.hash('password123', 1)
    mockSelectUser({
      id: 'user-id',
      name: 'Alice',
      email: 'alice@test.com',
      passwordHash,
      role: 'user',
    })
    const res = await supertest(buildApp())
      .post('/auth/login')
      .send({ email: 'alice@test.com', password: 'password123' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      id: 'user-id',
      name: 'Alice',
      email: 'alice@test.com',
      role: 'user',
    })
    const cookies = res.headers['set-cookie'] as unknown as string[]
    expect(cookies.some((c: string) => c.startsWith('access_token='))).toBe(true)
    expect(cookies.some((c: string) => c.startsWith('refresh_token='))).toBe(true)
  })
})

describe('POST /auth/refresh', () => {
  it('returns 401 when refresh_token cookie is missing', async () => {
    const res = await supertest(buildApp()).post('/auth/refresh')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'INVALID_REFRESH_TOKEN' })
  })

  it('returns 401 for an invalid refresh token', async () => {
    const res = await supertest(buildApp())
      .post('/auth/refresh')
      .set('Cookie', 'refresh_token=bad.token.here')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'INVALID_REFRESH_TOKEN' })
  })

  it('sets a new access_token cookie for a valid refresh token', async () => {
    const jwt = await import('jsonwebtoken')
    const refreshToken = jwt.sign(
      { sub: 'user-id', email: 'alice@test.com', role: 'user' },
      'test-refresh-secret',
      { expiresIn: '7d' }
    )
    const res = await supertest(buildApp())
      .post('/auth/refresh')
      .set('Cookie', `refresh_token=${refreshToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
    const cookies = res.headers['set-cookie'] as unknown as string[]
    expect(cookies.some((c: string) => c.startsWith('access_token='))).toBe(true)
  })
})

describe('POST /auth/logout', () => {
  it('returns 200 and clears both cookies', async () => {
    const res = await supertest(buildApp()).post('/auth/logout')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
    const cookies = res.headers['set-cookie'] as unknown as string[]
    expect(cookies.some((c: string) => c.includes('access_token=;'))).toBe(true)
    expect(cookies.some((c: string) => c.includes('refresh_token=;'))).toBe(true)
  })
})

describe('GET /auth/me', () => {
  it('returns 401 when no access_token cookie', async () => {
    const res = await supertest(buildApp()).get('/auth/me')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'TOKEN_EXPIRED' })
  })

  it('returns the current user for a valid token', async () => {
    const jwt = await import('jsonwebtoken')
    const accessToken = jwt.sign(
      { sub: 'user-id', email: 'alice@test.com', role: 'user' },
      'test-access-secret',
      { expiresIn: '15m' }
    )
    const res = await supertest(buildApp())
      .get('/auth/me')
      .set('Cookie', `access_token=${accessToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      id: 'user-id',
      email: 'alice@test.com',
      role: 'user',
    })
  })
})
