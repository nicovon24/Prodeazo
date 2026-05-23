# PRODEAZO FIFA 2026 — Backend (AGENTS)

Guide for working **only** in this package: Express API, persistence, and jobs. Web clients and other apps consume this API; they are not described here.

## Domain (minimal context)

Prediction pool (“prode”) app for the 2026 World Cup. Users submit scorelines before each match and earn points by accuracy. There are private mini leagues (groups) with invite codes.

## Folder layout (`backend/`)

```
src/
├── controllers/   # Thin HTTP handlers; delegate to models/services
├── models/        # Drizzle queries
├── services/      # Business rules, cache, external APIs
├── providers/     # Data provider abstraction (Bzzoiro / API-Football)
├── routes/        # Express routers
├── middleware/    # requireAuth, errors, etc.
├── db/            # Drizzle client + schema
├── config/        # Passport, Redis, session
├── jobs/          # Recurring score sync job
└── scripts/       # Seeds and CLI helpers
drizzle/           # Generated migrations + meta
```

## Stack

- **Runtime**: Node.js, Express 5, strict TypeScript (`tsx` in dev)
- **ORM**: Drizzle + `drizzle-kit` — schema in `src/db/schema.ts`
- **DB**: PostgreSQL (`pg`)
- **Cache / sessions**: Redis (`ioredis`, `connect-redis`)
- **Auth**: Passport (Google OAuth 2.0 + local)
- **Validation**: Zod v4
- **Packages**: this folder declares `packageManager` pnpm; scripts also work with `npm run` from `backend/`

## Data providers

Real fixtures flow through the provider layer, not ad hoc logic in controllers:

- `src/providers/` — adapter, HTTP, token refresh
- `src/services/bzzoiro.service.ts` — Bzzoiro BSD integration (tournament/testing)
- Switch providers only via `DATA_PROVIDER` and the providers layer, **without** scattering conditionals across controllers or models
- API-Football is the documented fallback / expected WC source

## Schema (`src/db/schema.ts`)

Main tables: `teams`, `fixtures`, `predictions`, `users`, `mini_leagues`, `mini_league_members`

Useful invariants:

- `(user_id, fixture_id)` unique on `predictions` — one prediction per user per match
- `(mini_league_id, user_id)` unique on `mini_league_members`
- CUID2 (`@paralleldrive/cuid2`) IDs except `teams.id` and `fixtures.id`, which follow upstream integers

## Scoring

- Logic in `src/services/scoring.ts` — pure functions, no DB access inside the calculator
- Sync job: `src/jobs/score-sync.ts`

## Implementation rules (API)

- New routes: Zod validation, `requireAuth` where needed, and `asyncHandler` on async handlers (Express 5 handles rejections differently from v4)
- Cache invalidation (fixtures, leaderboard) lives in `CacheService` — do not call Redis directly from controllers
- No second parallel server/API unless architecture explicitly decides it
- URLs, tokens, and secrets come from `src/env.ts`, not hardcoded literals

## Commands (from `backend/`)

```bash
pnpm dev          # or: npm run dev
pnpm db:push      # apply schema to DB
pnpm db:studio    # Drizzle Studio
pnpm seed         # tournament test data
pnpm build && pnpm start   # local production-like run
```

## File conventions

- **Controllers**: req/res, Zod, call model or service, return JSON
- **Models**: Drizzle only, no business rules
- **Services**: business + external HTTP; may use models
- **Routes**: wire controllers + middleware, no logic
- **Utilities**: `asyncHandler`, `apiError`, `paginate`, etc. as in existing code

## Avoid

- Importing Drizzle or `pg` in controllers — use models
- Computing points outside `scoring.ts`
- Committing `.env` or session secrets

## Repo references

- Roadmap / planning: `.planning/ROADMAP.md`, `.planning/PROJECT.md`
- Schema: `src/db/schema.ts`
- Migrations: `drizzle/`
