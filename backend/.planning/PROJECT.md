# ProdeazoApp — Backend

## What This Is

Node.js/TypeScript backend for a 2026 World Cup prediction pool. Users sign in with Google, submit match score predictions, and earn points based on accuracy. The backend calls Bzzoiro for fixtures, live scores, and standings.

## Context

Data infrastructure is in place (auth, DB schema, Redis cache, Bzzoiro integration), but three gaps remain before it is truly deploy-ready:
1. **Hardening** — async handlers without try/catch, unvalidated inputs, internal field leaks
2. **Sync loop** — scores update in Bzzoiro but are not always persisted to our DB paths
3. **Scoring** — `calculatePredictionPoints()` exists but must be wired; predictions need persisted points

The frontend is handled by another developer — this plan is 100% backend.

## Stack

- **Runtime:** Node.js + TypeScript + Express
- **DB:** PostgreSQL via Drizzle ORM
- **Cache:** Redis (ioredis)
- **Auth:** Google OAuth via Passport.js + express-session
- **Provider:** Bzzoiro API (fixtures, live scores, standings, rosters)
- **Tests:** none yet

## Core Value

Users can make predictions and see how many points they earned after each match.

## Requirements

### Validated (already in codebase)

- ✓ Google OAuth with Redis-backed sessions
- ✓ DB schema: users, teams, fixtures, predictions (and mini leagues)
- ✓ Routes: auth, teams, fixtures (/live, /standings), predictions CRUD
- ✓ Bzzoiro integration with Redis caching (TTLs)
- ✓ Seed script for fixtures / teams
- ✓ Scoring logic implemented (`scoring.ts`)

### Active

- [ ] **SEC-01** — All async route handlers wrapped with try/catch or `asyncHandler`
- [ ] **SEC-02** — Global Express error handler (no stack traces leaked)
- [ ] **SEC-03** — Zod validation on predictions POST/PUT
- [ ] **SEC-04** — Auth `/me` returns `{id, email, name, avatar}` only (no `googleId`)
- [ ] **SEC-05** — Logout destroys the session (`session.destroy`, not only `req.logout`)
- [ ] **SEC-06** — Cookie with `sameSite: 'lax'` and `httpOnly: true`
- [ ] **DB-01** — `notNull` on `predictions.userId` and `predictions.fixtureId`
- [ ] **DB-02** — Validate `DATABASE_URL` and critical env vars at startup
- [ ] **HTTP-01** — Fix `getAllPages` off-by-one (`http.ts`) for exact multiples of page size
- [ ] **SYNC-01** — Job updates `homeScore`/`awayScore`/`status` on fixtures every ~60s from Bzzoiro
- [ ] **SYNC-02** — When a fixture reaches `finished`, run `calculatePredictionPoints` for all related predictions
- [ ] **SYNC-03** — Persist scoring results via `UPDATE predictions.points`
- [ ] **API-01** — `GET /api/leaderboard` — users ranked by total points

### Out of Scope

- Frontend — teammate’s scope
- WebSockets / SSE — frontend polls; backend push not required here
- Automated tests in this milestone — focus on functional stability first
- CI/CD — out of scope for now

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| `setInterval` in `index.ts` for sync job | Simpler, no extra scheduler dependency. Predictable WC traffic, low concurrency | Pending |
| Zod only at boundaries (predictions) | Auth inputs handled by Passport; fixtures/teams are provider read-mostly | Pending |
| `asyncHandler` wrapper instead of try/catch per handler | DRY; single place to adjust error handling | Pending |

## Evolution

This document updates at each phase and milestone boundary.

**After each phase:**
1. Any invalidated requirement? → Move to Out of Scope with rationale
2. Any validated requirement? → Move to Validated with phase reference
3. New requirements? → Add under Active
4. Decisions worth logging? → Add to Key Decisions

---
*Last updated: 2026-05-04 — project initialization*
