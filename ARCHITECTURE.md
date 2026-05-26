# ARCHITECTURE.md — Prodeazo

Architecture Decision Records. Each ADR documents a choice that cost time to figure out — so the next session doesn't have to.

Update this file when a decision changes or a new architectural choice is made. The Architect agent owns this file.

---

## ADR-001: JWT in localStorage instead of cookies

**Status:** Active (migrated May 2026)
**Decision:** Use signed JWTs stored in localStorage, sent as `Authorization: Bearer <token>`. Not cookies.
**Why:** Frontend is on Vercel (vercel.app subdomain), backend is on Render (onrender.com subdomain). Cross-origin cookie sharing requires `SameSite=None; Secure` plus CORS `credentials: true`, which proved brittle across the Vercel/Render deployment boundary. JWT in localStorage avoids all cross-origin cookie issues.
**Trade-off:** localStorage is accessible to JS (XSS risk). Mitigated by short token expiry and no sensitive data in JWT payload (only `userId`, `email`, `name`).
**Impact:** Every authenticated request must include `Authorization: Bearer <token>`. The frontend stores/reads the token from localStorage. Do not reference `SESSION_SECRET`, `connect.sid`, or `express-session` — they are removed.

---

## ADR-002: In-memory Map cache instead of Redis

**Status:** Active
**Decision:** `CacheService` uses a `Map<string, {value, expiresAt}>` with TTL. No Redis.
**Why:** MVP scale (hundreds of users). Redis adds infra cost, connection management, and serialization. The in-memory cache is sufficient and resets cleanly on restart (data is re-fetched from Bzzoiro or DB).
**Trade-off:** Cache is per-process. If backend runs multiple replicas, each has its own cache. Acceptable at current scale; migrate to Redis when horizontal scaling is needed.
**Impact:** `CacheService` is the single source of truth for cache. Do not add caching elsewhere.

---

## ADR-003: Bzzoiro BSD as primary data provider

**Status:** Active
**Decision:** All fixture, score, and standings data comes from Bzzoiro BSD. API-Football is documented as fallback but not implemented.
**Why:** Bzzoiro has 2026 World Cup data available. API-Football is a more stable long-term option but requires additional integration work.
**Trade-off:** Bzzoiro is less documented; integration was trial-and-error. Switch via `DATA_PROVIDER` env var and the `src/providers/` adapter layer — no controller changes needed.
**Impact:** Never call Bzzoiro directly from controllers or models. All external data goes through `src/providers/` → `src/services/bzzoiro.service.ts`.

---

## ADR-004: Drizzle ORM over Prisma

**Status:** Active
**Decision:** Drizzle ORM with `drizzle-kit` for migrations. No Prisma.
**Why:** Drizzle has direct PostgreSQL support without a query engine proxy, lower overhead, and TypeScript-first schema definition. Schema lives in `src/db/schema.ts`.
**Impact:** Schema changes: edit `schema.ts` → `pnpm db:push` (dev) or generate migration for prod. No `prisma generate` step.

---

## ADR-005: pnpm workspaces monorepo

**Status:** Active
**Decision:** Single repo with `frontend/` and `backend/` as workspace packages. Scripts run from root or from each package directory.
**Why:** Shared tooling (ESLint, TypeScript config) without duplication. Single `git` history for coordinated changes.
**Trade-off:** `pnpm install` from root installs all deps. Run package-specific scripts from the package directory or use `pnpm --filter`.

---

## ADR-006: Express 5 + asyncHandler wrapper

**Status:** Active
**Decision:** Express 5 (not v4). Async route handlers are wrapped with `asyncHandler` from `src/utils/asyncHandler.ts`.
**Why:** Express 5 changed how it handles async rejections vs v4. `asyncHandler` provides a single, consistent error propagation point. Do not add try/catch inside handlers — let `asyncHandler` forward to the global error middleware.
**Impact:** Every new async route handler must be wrapped: `router.get('/', asyncHandler(async (req, res) => { ... }))`.

---

## ADR-007: One-time code exchange for OAuth callback

**Status:** Active
**Decision:** The Google OAuth callback hits the backend, which issues a short-lived one-time code. The frontend exchanges this code for a JWT via a separate request.
**Why:** The OAuth callback redirects to the backend domain. Passing the JWT directly in the redirect URL (as a query param) is a security risk (logged in URLs, referrer headers). One-time codes expire in seconds and can only be used once.
**Impact:** Auth flow: Google → backend `/api/auth/callback` → redirect to frontend with `?code=<one-time-code>` → frontend POSTs to `/api/auth/exchange` → receives JWT.

---

## ADR-008: Scoring is pure, sync'd by a job

**Status:** Active
**Decision:** `calculatePredictionPoints()` in `src/services/scoring.ts` is a pure function (no DB access). Points are persisted by the `score-sync` job when a fixture transitions to `finished`.
**Why:** Pure functions are testable without DB setup. The sync job handles idempotency: only scores predictions with `points IS NULL`.
**Impact:** Never compute points in controllers, models, or routes. Never call scoring logic outside the sync job path.

---

## Topology Diagram

```
Browser
  │  HTTPS
  ▼
Vercel (frontend — Next.js)
  │  HTTPS + Authorization: Bearer <jwt>
  ▼
Render (backend — Express)
  │  SQL
  ▼
Supabase PostgreSQL (prod)

Local dev:
  docker-compose → Postgres (5432) + Backend (4000)
  pnpm dev       → Frontend (3000)
```
