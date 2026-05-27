# CLAUDE.md — Prodeazo

## What This Is

Prediction pool app for the 2026 FIFA World Cup. Users sign in with Google, submit scoreline predictions before each match, and earn points by accuracy. Private mini leagues let groups compete against each other.

**Deploy target:** Vercel (frontend) + Render (backend) + Supabase PostgreSQL (prod DB)
**Local dev:** Docker Compose (Postgres + backend) + Next.js dev server (frontend)

## Monorepo Layout

```
ProdeazoAppNuevo/
├── frontend/          # Next.js 16 App Router — Vercel
├── backend/           # Express 5 + Drizzle — Render
├── docker-compose.yml # Local: Postgres (5433) + backend (4000) + migrations
├── CLAUDE.md          # ← you are here (L1 Context)
├── VISION.md          # Product vision, business domain
├── ARCHITECTURE.md    # Architecture decisions (ADRs)
└── DEVELOPMENT_GUIDE.md
```

## Stack (current, authoritative)

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind v4, HeroUI, Zustand, React Query |
| Backend | Node.js, Express 5, TypeScript, Drizzle ORM |
| Database | PostgreSQL (Docker local / Supabase prod) |
| Auth | Google OAuth 2.0 → JWT stored in localStorage |
| Cache | In-memory Map with TTL (`src/services/cache.service.ts`) |
| Data provider | Bzzoiro BSD (fixtures, live scores, standings) |
| Package manager | pnpm workspaces |

> Auth is JWT-based (migrated from cookie-session in May 2026). Do not reference `SESSION_SECRET`, `connect.sid`, or `cookie-session` — those are gone.

## Agent Roles

Each session should adopt one role. Do not mix roles in a single session.

| Role | File | Scope |
|------|------|-------|
| **Product** | `docs/agents/product.md` | Spec, feature definition, scope |
| **Architect** | `docs/agents/architect.md` | Design, ADRs, ARCHITECTURE.md updates |
| **Developer** | `docs/agents/developer.md` | Implementation on a specific plan |
| **Reviewer** | `docs/agents/reviewer.md` | Code review, security, conventions |

## Domain Rules (L3)

Prescriptive files loaded per agent session:

- `docs/rules/api.md` — endpoint contracts, auth, error format
- `docs/rules/frontend.md` → `frontend/AGENTS.md`
- `docs/rules/testing.md` — what to test, how, with what tools
- `docs/rules/infrastructure.md` — deploy topology, env vars, Docker

## Pipeline

```
SPEC → PLAN → TEST → CODE → REVIEW → PR (human)
```

Each step produces a written artifact. Deployment is continuous: every completed task on `master` is potentially shippable.

## Key Invariants

- **Never compute points outside `backend/src/services/scoring.ts`**
- **Never access Drizzle/pg in controllers** — use models
- **Secrets and URLs come from `backend/src/env.ts`** — never hardcode
- **JWT is stored in localStorage on the frontend**, sent as `Authorization: Bearer <token>`
- **In-memory cache invalidation lives in `CacheService`** — do not bypass in controllers
- **One prediction per `(user_id, fixture_id)`** — enforced at DB level

## Language

**All project documentation must be written in English.** This applies to:
- All `.md` files in the root, `backend/`, `frontend/`, and `docs/` directories
- Code comments, JSDoc, and inline documentation
- Commit messages
- `CURRENT.md` session notes

The app UI itself remains in Spanish (it targets Argentine/Spanish-speaking users).

## What to Read First Per Task

**Always start with `CURRENT.md`** — it tells you what was done last session, what's in progress, and what comes next. Read it before anything else.

| Task type | Start here |
|-----------|-----------|
| Any session | `CURRENT.md` → then the task-specific file below |
| Backend feature | `backend/AGENTS.md` → `backend/src/db/schema.ts` |
| Frontend feature | `frontend/AGENTS.md` → `frontend/src/api/client.ts` |
| Auth flow | `ARCHITECTURE.md` ADR-001 |
| DB schema change | `backend/DATABASE.md` → `backend/src/db/schema.ts` |
| Scoring logic | `backend/src/services/scoring.ts` |
| Deploy / env vars | `docs/rules/infrastructure.md` |
