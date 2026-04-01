import cookieParser from 'cookie-parser'
import express from 'express'
import jwt from 'jsonwebtoken'
import supertest from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { requireAuth, requireRole } from './auth'

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret'
})

function buildApp() {
  const app = express()
  app.use(cookieParser())
  app.get('/protected', requireAuth, (req, res) => {
    res.json(req.user)
  })
  app.get('/admin-only', requireRole('admin'), (req, res) => {
    res.json(req.user)
  })
  return app
}

describe('requireAuth', () => {
  it('returns 401 when no access_token cookie', async () => {
    const res = await supertest(buildApp()).get('/protected')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'TOKEN_EXPIRED' })
  })

  it('returns 401 for a tampered token', async () => {
    const res = await supertest(buildApp())
      .get('/protected')
      .set('Cookie', 'access_token=not.a.real.token')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'TOKEN_EXPIRED' })
  })

  it('attaches req.user and calls next for a valid token', async () => {
    const token = jwt.sign(
      { sub: 'user-123', email: 'alice@test.com', role: 'user' },
      'test-access-secret',
      { expiresIn: '15m' }
    )
    const res = await supertest(buildApp())
      .get('/protected')
      .set('Cookie', `access_token=${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: 'user-123', email: 'alice@test.com', role: 'user' })
  })
})

describe('requireRole', () => {
  it('returns 403 when user role does not match required role', async () => {
    const token = jwt.sign(
      { sub: 'user-123', email: 'alice@test.com', role: 'user' },
      'test-access-secret',
      { expiresIn: '15m' }
    )
    const res = await supertest(buildApp())
      .get('/admin-only')
      .set('Cookie', `access_token=${token}`)
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: 'FORBIDDEN' })
  })

  it('allows through when user role matches', async () => {
    const token = jwt.sign(
      { sub: 'admin-456', email: 'admin@test.com', role: 'admin' },
      'test-access-secret',
      { expiresIn: '15m' }
    )
    const res = await supertest(buildApp())
      .get('/admin-only')
      .set('Cookie', `access_token=${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: 'admin-456', email: 'admin@test.com', role: 'admin' })
  })
})
