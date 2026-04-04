# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

Turborepo monorepo managed with pnpm workspaces:

```
help-desk-app/
├── apps/
│   ├── api/          # Express + Drizzle ORM backend (port 3001)
│   └── web/          # Next.js 15 + Tailwind CSS v4 frontend (port 3000)
├── packages/
│   ├── shared/       # Domain types shared between api and web (User, Ticket, Client)
│   └── tsconfig/     # Shared TypeScript configs (base, nextjs, node)
└── docker-compose.yml  # PostgreSQL 17 on port 5433
```

## Commands

Run all commands from `help-desk-app/`:

```bash
pnpm dev          # Start all apps in parallel (turbo)
pnpm build        # Build all apps
pnpm lint         # Biome lint + format check across entire monorepo
pnpm typecheck    # TypeScript check across all apps

# Run for a specific app only
pnpm --filter @repo/api dev
pnpm --filter @repo/web dev
```

Database:
```bash
docker compose up -d   # Start PostgreSQL (port 5433)
# DATABASE_URL=postgres://helpdesk:helpdesk@localhost:5433/helpdesk
```

Drizzle migrations (from `apps/api/`):
```bash
pnpm drizzle-kit generate   # Generate migration files
pnpm drizzle-kit migrate    # Apply migrations
```

## Architecture

### API (`apps/api`)
- Express app; all routes mounted under `/api`
- `src/db/index.ts` — Drizzle client initialized from `DATABASE_URL`
- `src/db/schema.ts` — Drizzle table definitions (currently empty, add tables here)
- `src/routes/index.ts` — Route definitions
- Built with `tsc` to `dist/`, run in dev with `tsx watch`

### Web (`apps/web`)
- Next.js 15 App Router with two route groups:
  - `(auth)` — `/login`, `/cadastro`
  - `(app)` — authenticated pages: `/chamados`, `/chamados/novo`, `/perfil`, admin routes under `/admin/chamados` and `/admin/clientes`
- Components live in `src/components/` and are re-exported via `src/components/index.ts`
- Styles in `src/styles/globals.css` using Tailwind CSS v4 `@theme` block

### Shared Package (`packages/shared`)
- TypeScript interfaces only: `User`, `Ticket`, `Client`
- Import as `@repo/shared` in both api and web

## Design System

Defined in `apps/web/src/styles/globals.css` via Tailwind CSS v4 `@theme`:
- **Font**: Lato (300, 400, 700, 900)
- **Brand colors**: `brand-400`, `brand-600`, `brand-900` (blue scale)
- **Neutral palette**: `neutral-50` through `neutral-950`
- **Status colors**: `status-open` (pink), `status-progress` (blue), `status-closed` (green), `danger` (red)

All design tokens become Tailwind utility classes automatically (e.g., `bg-brand-600`, `text-neutral-500`).

### Component Patterns
UI components use `tailwind-variants` (`tv()`) for variant logic and `tailwind-merge` (`twMerge`) for className merging. Example pattern from `Button`:
```tsx
const component = tv({ base: '...', variants: { ... } })
export function Component({ variant, className, ...props }) {
  return <element className={twMerge(component({ variant }), className)} {...props} />
}
```

## Tooling

- **Biome** (v2): linting + formatting + import organization. Config: `biome.json`. Single quotes, no semicolons, 2-space indent, 80-char line width.
- **Turbo**: task orchestration. `build` depends on `^build` (shared packages built first); `typecheck` also depends on `^build`.
- **pnpm**: package manager. Use workspace protocol (`workspace:*`) for internal dependencies.
