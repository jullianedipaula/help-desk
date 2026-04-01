# JWT Authentication Design

**Date:** 2026-04-01
**Status:** Approved

## Overview

Stateless JWT authentication for the HelpDesk monorepo. The Express API issues short-lived access tokens and long-lived refresh tokens as HttpOnly cookies. Next.js Middleware protects the `(app)` route group before pages render.

---

## Database

New `users` table defined in `apps/api/src/db/schema.ts` via Drizzle ORM:

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `name` | `text` | Not null |
| `email` | `text` | Unique, not null |
| `password_hash` | `text` | bcrypt hash, not null |
| `role` | `text` | `'admin' \| 'user'`, default `'user'` |
| `created_at` | `timestamp` | Default `now()` |

---

## API Endpoints

All routes mounted under `/api/auth` in `apps/api/src/routes/auth.ts`.

| Method | Path | Auth required | Description |
|--------|------|---------------|-------------|
| `POST` | `/api/auth/register` | No | Create user; role always `'user'` |
| `POST` | `/api/auth/login` | No | Verify credentials; set token cookies |
| `POST` | `/api/auth/refresh` | Refresh cookie | Issue new access token cookie |
| `POST` | `/api/auth/logout` | No | Clear both cookies (`Max-Age=0`) |
| `GET` | `/api/auth/me` | Access cookie | Return `{ id, name, email, role }` |

### Token Configuration

- **Access token:** 15 minutes, signed with `JWT_ACCESS_SECRET`, stored in `access_token` cookie
- **Refresh token:** 7 days, signed with `JWT_REFRESH_SECRET`, stored in `refresh_token` cookie
- **Cookie flags:** `HttpOnly; Secure; SameSite=Strict`

### Token Strategy

Stateless — no token state stored in the database. Tokens cannot be individually revoked before expiry. Full invalidation requires rotating `JWT_REFRESH_SECRET`.

---

## API Middleware

**`apps/api/src/middlewares/auth.ts`** — `requireAuth`:
1. Read `access_token` cookie via `cookie-parser`
2. Verify signature with `JWT_ACCESS_SECRET` using `jsonwebtoken`
3. If valid: attach `req.user = { id, email, role }`, call `next()`
4. If invalid or expired: respond `401 { "error": "TOKEN_EXPIRED" }`

**`requireRole(role: string)`** — composed on top of `requireAuth`:
- Check `req.user.role === role`; if not, respond `403 { "error": "FORBIDDEN" }`

---

## Frontend Route Protection

**`apps/web/src/middleware.ts`** — Next.js Edge Middleware:
- Matcher: `/chamados/:path*`, `/perfil/:path*`, `/admin/:path*`
- Library: `jose` (Edge-runtime compatible JWT verification)
- Logic:
  1. Read `access_token` cookie
  2. Verify with `JWT_ACCESS_SECRET`
  3. Valid → allow request through
  4. Missing/invalid → `NextResponse.redirect('/login')`
  5. `/admin/*` path + `role !== 'admin'` → `NextResponse.redirect('/chamados')`

**Session hydration:**
- The `(app)` layout (Server Component) calls `GET /api/auth/me` with the cookie forwarded via `headers()` from `next/headers`
- Passes `user` as a prop to child layouts/pages
- No client-side auth state needed for initial render

**Token refresh (client-side fetch wrapper):**
- A utility in `apps/web/src/lib/fetch.ts` wraps `fetch`
- On `401` response: call `POST /api/auth/refresh` once
- If refresh succeeds: retry original request
- If refresh fails: `window.location.href = '/login'`

---

## Error Responses

All API errors follow the shape `{ "error": string }`:

| Code | Error key | Trigger |
|------|-----------|---------|
| 400 | `VALIDATION_ERROR` | Missing/invalid request body fields |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password on login |
| 401 | `TOKEN_EXPIRED` | Access token missing or invalid |
| 401 | `INVALID_REFRESH_TOKEN` | Refresh token missing or invalid |
| 403 | `FORBIDDEN` | Insufficient role |
| 409 | `EMAIL_ALREADY_EXISTS` | Duplicate email on register |

---

## Security

- **Password hashing:** `bcrypt` with cost factor 12
- **Separate secrets:** `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are distinct — a leaked access secret does not compromise refresh tokens
- **Cookie flags:** `HttpOnly` (no JS access), `Secure` (HTTPS in production), `SameSite=Strict` (CSRF protection)
- **Logout:** server clears cookies by setting `Max-Age=0` — no client JS needed

---

## Environment Variables

```env
# apps/api/.env
DATABASE_URL=postgres://helpdesk:helpdesk@localhost:5433/helpdesk
JWT_ACCESS_SECRET=<random 64-char hex string>
JWT_REFRESH_SECRET=<random 64-char hex string>
```

```env
# apps/web/.env.local
JWT_ACCESS_SECRET=<same value as API — used by Edge Middleware>
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## New Dependencies

**`apps/api`:**
- `bcrypt` + `@types/bcrypt`
- `jsonwebtoken` + `@types/jsonwebtoken`
- `cookie-parser` + `@types/cookie-parser`

**`apps/web`:**
- `jose`

---

## File Map

```
apps/api/src/
  db/schema.ts                  ← add users table
  middlewares/auth.ts           ← requireAuth, requireRole
  routes/auth.ts                ← register, login, refresh, logout, me
  routes/index.ts               ← mount /auth router

apps/web/src/
  middleware.ts                 ← Edge JWT verification + redirects
  lib/fetch.ts                  ← fetch wrapper with auto-refresh
  app/(app)/layout.tsx          ← call /api/auth/me, pass user down
```
