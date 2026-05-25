# Requirements — ProdeazoApp Backend

## v1 Requirements

### Security & Error Handling

- [ ] **SEC-01** — All async route handlers are wrapped with `asyncHandler` (process does not crash on DB errors)
- [ ] **SEC-02** — Global Express error handler returns JSON `{error: message}` without stack traces in production
- [ ] **SEC-03** — `POST /api/predictions` validates body with Zod (`fixtureId: number`, `homeGoals`: 0–20, `awayGoals`: 0–20) and returns 400 with a clear message when invalid
- [ ] **SEC-04** — `GET /api/auth/me` returns `{id, email, name, avatar}` only — never exposes `googleId` or internal fields
- [ ] **SEC-05** — `POST /api/auth/logout` calls `req.logout()` to clear the cookie-session
- [ ] **SEC-06** — Session cookie has `sameSite: 'lax'` and `httpOnly: true`

### DB & Startup Integrity

- [ ] **DB-01** — Columns `userId` and `fixtureId` on `predictions` have NOT NULL constraint in Drizzle schema
- [ ] **DB-02** — On startup the app verifies `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET` exist — logs and `process.exit(1)` when missing

### HTTP Provider Fix

- [ ] **HTTP-01** — `getAllPages` in `http.ts` does not issue one extra HTTP round-trip when total rows equal an exact multiple of page size (off-by-one fix in termination condition)

### Score Sync

- [ ] **SYNC-01** — A job (`setInterval` or node-cron) runs every ~60 seconds, calls Bzzoiro live scores, and updates `homeScore`, `awayScore`, `status` on `fixtures` for rows that are still `not_started` or `in_progress` within the polled date window (see implementation)
- [ ] **SYNC-02** — When fixture status transitions to **`finished`**, invoke `calculatePredictionPoints()` from `scoring.ts` for every prediction on that fixture
- [ ] **SYNC-03** — Persist computed totals with `UPDATE predictions.points`

### Leaderboard API

- [ ] **API-01** — Endpoint `GET /api/leaderboard` returns `{userId, name, avatar, totalPoints}[]` ordered by `totalPoints` DESC (`SUM(predictions.points)` grouped by user with JOIN to users)

## v2 Requirements (deferred)

- Notifications when a match starts or ends
- Prediction history endpoint per user
- Leaderboard cache in Redis (currently direct DB query)
- Rate limiting on prediction endpoints
- Automated tests (unit + integration)

## Out of Scope

- Frontend — teammate ownership
- WebSockets / SSE — frontend polls today
- CI/CD pipeline
- Multi-tournament orchestration beyond WC 2026 for now

## Traceability

| REQ-ID | Phase | Plan |
|--------|-------|------|
| SEC-01, SEC-02, SEC-06 | Phase 1: Security & Error Handling | Plan 1.1 |
| SEC-03, SEC-04, SEC-05 | Phase 1: Security & Error Handling | Plan 1.2 |
| DB-01, DB-02, HTTP-01 | Phase 2: Schema & Startup Integrity | Plan 2.1 |
| SYNC-01 | Phase 3: Score Sync Worker | Plan 3.1 |
| SYNC-02, SYNC-03 | Phase 4: Auto-Scoring | Plan 4.1 |
| API-01 | Phase 5: Leaderboard API | Plan 5.1 |
