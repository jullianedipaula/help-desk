# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Help Desk is a call management system built as a **pnpm monorepo** with Turborepo. It has two apps (`api`, `web`) and one shared package (`tsconfig`).

- **API** — Express 5 + TypeScript + Prisma ORM → `http://localhost:3001`
- **Web** — Next.js 15 + Tailwind CSS v4 → `http://localhost:3000`
- **Database** — PostgreSQL 17 via Docker on port **5433** (not 5432 — already occupied by another project on this machine)

## Common Commands

```bash
# Start all apps
pnpm dev

# Start only the API
pnpm --filter @help-desk/api dev

# Type-check all workspaces
pnpm type-check

# Format and lint (Biome)
pnpm check

# Run from within apps/api/
npx tsx src/index.ts        # one-off run
npx prisma studio           # open Prisma GUI
npx prisma migrate dev      # run pending migrations
npx prisma db seed          # seed admin + services
```

## Database Setup

```bash
docker compose up -d                              # start PostgreSQL
pnpm --filter @help-desk/api db:migrate          # apply migrations
pnpm --filter @help-desk/api db:generate         # regenerate Prisma client
pnpm --filter @help-desk/api db:seed             # seed initial data
```

The Prisma client is generated into `apps/api/src/generated/prisma/` and is **git-ignored** — always run `db:generate` after cloning or after schema changes.

Seed creates: `admin@helpdesk.local` / `Admin1234!` and two default services.

## Environment Variables

`apps/api/.env` (required, git-ignored — copy from `.env.example`):

```
DATABASE_URL="postgresql://helpdesk:helpdesk@localhost:5433/helpdesk?schema=public"
PORT=3001
NODE_ENV="development"
JWT_SECRET="<min 32 chars>"
JWT_EXPIRES_IN="15m"
```

The API validates all env vars at startup via Zod (`src/config/env.ts`) and exits immediately if any are missing or invalid.

## API Architecture

All routes are mounted under `/api`. The entry barrel is `apps/api/src/routes/index.ts`.

```
/api/health                    — public health check
/api/auth/*                    — public (register, login) + authenticated (change-password)
/api/admin/admins/*            — ADMIN only
/api/admin/technicians/*       — ADMIN only
/api/admin/services/*          — ADMIN only
/api/admin/clients/*           — ADMIN only
/api/admin/calls/*             — ADMIN only
```

### Module Pattern

Every feature module lives in `apps/api/src/modules/<name>/` and always has exactly three files:

- `<name>.schema.ts` — Zod input schemas + inferred TypeScript types
- `<name>.service.ts` — Prisma queries and business logic; throws typed errors
- `<name>.router.ts` — Express Router; calls `safeParse`, delegates to service, maps errors to HTTP

New modules must follow this same structure.

### Error Handling

Services throw from `src/lib/errors.ts`:

```typescript
throw new ConflictError('Email already in use')   // → 409
throw new NotFoundError('Technician not found')   // → 404
throw new ForbiddenError('Cannot delete your own account') // → 403
```

Routers call `handleServiceError(err, res)` in every catch block — never inline status mapping.

### Auth Middleware

```typescript
import { authenticate, authorize } from '../auth/auth.middleware'

router.use(authenticate, authorize('ADMIN'))   // protect entire router
router.get('/route', authenticate, handler)    // protect single route
```

`authenticate` attaches `req.user: { id, email, role }`. `authorize(...roles)` checks role membership.

### Prisma Conventions

- Never return `password` from any query — always use explicit `select` objects
- Technician and Client are profile extensions of User (one-to-one); use nested writes to create both atomically
- Cascade rules: deleting a Client User cascades to Client → Calls. Deleting a Technician User nullifies `technicianId` on calls (`SetNull`)
- Services use soft delete (`isActive: false`) — never hard-delete a service

### Data Model Summary

```
User (id, name, email, password, role: USER|ADMIN|TECHNICIAN|CLIENT)
  ├── Technician (availableFrom, availableTo, mustChangePassword)
  │     └── Call[] (assigned calls)
  └── Client
        └── Call[] (owned calls — cascade deleted with Client)

Service (name, description, isActive — soft delete)
  └── Call[]

Call (description, status: OPEN|IN_PROGRESS|RESOLVED|CLOSED, closedAt)
```

## Code Style

Enforced by Biome (`biome.json`):
- **Single quotes**, **semicolons only when required**, **2-space indent**, line width 100
- Import organization is automatic

The API uses CommonJS (`"module": "CommonJS"` in `packages/tsconfig/node.json`). Do **not** use path aliases (`@/*`) in the API — `tsc` does not rewrite them in CommonJS output. Use relative imports only.

## Adding a New Admin Module

1. Create `apps/api/src/modules/<name>/<name>.schema.ts` — Zod schemas
2. Create `apps/api/src/modules/<name>/<name>.service.ts` — Prisma logic, typed errors
3. Create `apps/api/src/modules/<name>/<name>.router.ts` — apply `router.use(authenticate, authorize('ADMIN'))` at the top
4. Mount in `apps/api/src/routes/index.ts` under `/admin/<name>`
5. If new models are needed, update `apps/api/prisma/schema.prisma` and run `db:migrate`
