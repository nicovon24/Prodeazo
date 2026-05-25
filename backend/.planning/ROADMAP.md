# Roadmap — ProdeazoApp Backend

**5 phases** | **13 requirements mapped** | All v1 requirements covered ✓

## Overview

| # | Phase | Goal | Requirements | Plans |
|---|-------|------|--------------|-------|
| 1 | Security & Error Handling | Backend does not crash or leak internals | SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06 | 2 |
| 2 | Schema & Startup Integrity | Correct DB constraints, safe startup, provider without bugs | DB-01, DB-02, HTTP-01 | 1 |
| 3 | Score Sync Worker | Fixture scores stay updated in DB from Bzzoiro | SYNC-01 | 1 |
| 4 | Auto-Scoring | Users’ predictions gain points automatically when a match finishes | SYNC-02, SYNC-03 | 1 |
| 5 | Leaderboard API | Frontend can fetch the global ranking | API-01 | 1 |

---

## Phase 1: Security & Error Handling

**Goal:** The backend does not crash on DB/provider errors, does not expose internal fields, and validates inputs at user-facing boundaries.

**Requirements:** SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06

**UI hint:** no

### Plan 1.1 — Async Safety & Global Error Handler

**Goal:** No async error kills the process; all errors return structured JSON.

**Tasks:**
1. Create `backend/src/utils/asyncHandler.ts` — `(fn) => (req, res, next) => Promise.resolve(fn(...)).catch(next)`
2. Wrap all handlers in `fixtures.routes.ts`, `teams.routes.ts`, `auth.routes.ts`, `predictions.routes.ts` with `asyncHandler`
3. Add global error middleware in `backend/src/index.ts` — `app.use((err, req, res, next) => res.status(500).json({error: err.message}))` with `NODE_ENV` check so production never returns stack traces
4. Ensure session cookie uses `sameSite: 'lax'` and `httpOnly: true` in `index.ts`

**Verification:**
- Force an error in a handler (deliberate `throw`) → response is `{error: "..."}` with 500 and the process keeps running
- In browser devtools, session cookie shows SameSite=Lax and HttpOnly

### Plan 1.2 — Input Validation & Auth Scrubbing

**Goal:** User inputs validated at the boundary; auth responses do not expose internal fields.

**Tasks:**
1. Add `zod` dependency in `backend/package.json`
2. Add Zod schema in `predictions.routes.ts`: `{ fixtureId: z.number().int().positive(), homeGoals: z.number().int().min(0).max(20), awayGoals: z.number().int().min(0).max(20) }` — return 400 on failure
3. In `auth.routes.ts` GET `/me`: map DB user to `{id, email, name, avatar}` only
4. In `auth.routes.ts` POST `/logout`: call `req.session.destroy()` after `req.logout()`, handle callback with `next(err)`

**Verification:**
- POST `/api/predictions` with `{}` → 400 with validation message
- POST `/api/predictions` with `homeGoals: -1` → 400
- GET `/api/auth/me` → body must not include `googleId`
- POST `/api/auth/logout` → session cleared (Redis key gone when applicable)

**Success Criteria:**
1. A throwing handler does not kill the server
2. POST `/api/predictions` with no body returns 400 with a clear error description
3. GET `/api/auth/me` never exposes `googleId`
4. Session cookie uses SameSite=Lax and HttpOnly

---

## Phase 2: Schema & Startup Integrity

**Goal:** DB schema reflects real constraints, the app fails fast on missing env vars, and the HTTP provider does not issue redundant requests.

**Requirements:** DB-01, DB-02, HTTP-01

**UI hint:** no

### Plan 2.1 — DB Constraints, Env Validation & HTTP Fix

**Tasks:**
1. In `backend/src/db/schema.ts`: add `.notNull()` to `userId` and `fixtureId` on `predictions`
2. Run Drizzle migration workflow to apply constraints (`pnpm drizzle-kit generate` + `pnpm drizzle-kit migrate`) as applicable
3. In `backend/src/env.ts` (create if missing): validate required vars at startup, `process.exit(1)` if any missing
4. Import `env.ts` at the top of `backend/src/index.ts` before other app imports
5. In `backend/src/providers/http.ts`, `getAllPages`: fix loop termination — stop when `data.length < pageSize` (not `<=`); verify edge case when total equals N × pageSize

**Verification:**
- Attempt insert without `userId` via Drizzle → constraint violation
- Start app with `DATABASE_URL` undefined → clear log and exit code 1
- Mock `getAllPages`: first page exactly `pageSize` items, second page 0 → no third request

**Success Criteria:**
1. `predictions` has NOT NULL on `userId` and `fixtureId` (check with `\d predictions` in psql)
2. App exits with `process.exit(1)` and readable message when a critical env var is missing
3. `getAllPages` does not fire an extra page when totals are multiples of page size

---

## Phase 3: Score Sync Worker

**Goal:** Fixture scores in the DB stay aligned with Bzzoiro automatically.

**Requirements:** SYNC-01

**UI hint:** no

### Plan 3.1 — Score Sync Job

**Tasks:**
1. Create `backend/src/jobs/score-sync.ts` — `runScoreSync()` that:
   a. Loads from DB fixtures with status `not_started` or `in_progress` whose date should still be polled (see implemented date window)
   b. Calls Bzzoiro for updated scores
   c. For each fixture with score or status changes, `UPDATE` the DB row
   d. Logs updated fixtures with `console.log`
2. On provider failure, log error and swallow — do not crash the process
3. Start job from `backend/src/index.ts` with `setInterval(runScoreSync, 60_000)` after the server listens
4. Invoke `runScoreSync()` once on startup (do not wait for first interval tick)

**Verification:**
- Manually set wrong scores in DB → within ≤60s they should reconcile
- Simulate Bzzoiro failure → server stays up and job logs the error

**Success Criteria:**
1. DB scores update without manual SQL
2. Provider errors never kill HTTP server readiness
3. First sync runs immediately after restart

---

## Phase 4: Auto-Scoring

**Goal:** User predictions persist earned points automatically when a match finishes.

**Requirements:** SYNC-02, SYNC-03

**UI hint:** no

### Plan 4.1 — Scoring Integration

**Tasks:**
1. In `score-sync.ts`, after detecting transition to **`finished`**:
   a. Load all predictions for that fixture from DB
   b. For each prediction, compute points with `calculatePredictionPoints` from `scoring.ts`
   c. `UPDATE predictions SET points = …`
2. Ensure scoring runs **once** per fixture (only rows with `predictions.points IS NULL`, or track prior status `in_progress` → `finished`)
3. Log: e.g. `Fixture finished: ${fixture.id} — ${n} predictions scored`

**Verification:**
- Seed fixture `in_progress` + predictions → flip to **`finished`** (or wait job) → `predictions.points` matches `scoring.ts`
- Calling sync again does not change scores (idempotent)

**Success Criteria:**
1. After `finished`, each prediction gets `points` in DB once
2. Idempotent reruns do not inflate scores
3. Values match `calculatePredictionPoints` for the achieved result

---

## Phase 5: Leaderboard API

**Goal:** Frontend can retrieve the global leaderboard by total points.

**Requirements:** API-01

**UI hint:** no

### Plan 5.1 — Leaderboard Endpoint

**Tasks:**
1. Create `backend/src/routes/leaderboard.routes.ts` GET `/`:
   ```sql
   SELECT users.id, users.name, users.avatar, SUM(predictions.points) as totalPoints
   FROM predictions
   JOIN users ON predictions.userId = users.id
   WHERE predictions.points IS NOT NULL
   GROUP BY users.id, users.name, users.avatar
   ORDER BY totalPoints DESC
   ```
2. Wrap handler with `asyncHandler`
3. Mount in `index.ts` as `app.use('/api/leaderboard', leaderboardRoutes)`
4. If nothing scored yet, return empty array `[]` (not 404)

**Verification:**
- Seed scored predictions for 2–3 users → GET `/api/leaderboard` sorts by `totalPoints` DESC
- GET with no scored rows → 200 + `[]`

**Success Criteria:**
1. Endpoint returns ranked JSON payload
2. Users without scored picks are omitted from ranking
3. Empty state is 200 with `[]`

---

## Dependency Order

```
Phase 1 (Hardening)
    ↓
Phase 2 (Schema + Startup)
    ↓
Phase 3 (Sync Worker)
    ↓
Phase 4 (Auto-Scoring) ← depends on sync worker
    ↓
Phase 5 (Leaderboard) ← depends on persisted points in DB
```

Phases 1 and 2 can overlap or reorder — they are independent. Later phases must follow this chain.
