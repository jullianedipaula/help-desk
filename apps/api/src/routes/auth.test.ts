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
