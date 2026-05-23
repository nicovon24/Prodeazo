# Prodeazo — API backend

HTTP API for the project (Express + Drizzle + Postgres). Routes are under the **`/api`** prefix. Default port: **`4000`** (`PORT` in `.env`).

## General conventions

| Topic | Detail |
|------|--------|
| Format | JSON (`Content-Type: application/json` where applicable). |
| CORS | Allowed origin: `FRONTEND_URL` (default `http://localhost:5173`). Credentials enabled (`credentials: true`). |
| Session | `connect.sid` cookie after login. The client must send `credentials: 'include'` on each request. |
| Security | `helmet` on all routes. Headers: `X-Content-Type-Options`, `X-Frame-Options`, etc. |
| Traceability | Every response includes `X-Request-Id` (UUID). |

Environment: copy **`backend/.env.example`** to **`backend/.env`** or **`backend/.env.local`** and fill in values.

---

## Response shape

### Lists (GET collection endpoints)

All GET endpoints that return lists use paginated format:

```json
{
  "count": 64,
  "next": null,
  "previous": null,
  "results": [ ... ]
}
```

**No query params** → returns all results; `next` and `previous` are `null`.

**With pagination** (`?page=N&limit=M`, default limit: 20):

```
GET /api/fixtures?page=2&limit=10
```

```json
{
  "count": 64,
  "next": "/api/fixtures?page=3&limit=10",
  "previous": "/api/fixtures?page=1&limit=10",
  "results": [ ... ]
}
```

### Errors

All errors use this shape:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Fixture not found"
  }
}
```

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid body or parameters |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Authenticated but not allowed |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Conflict (duplicate email, already a member, etc.) |
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Endpoints

### Health

#### `GET /api/health`

```json
{ "ok": true }
```

---

### Authentication (`/api/auth`)

The API supports two auth methods. Both use the same session system (`connect.sid` cookie).

#### Google OAuth

Requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and the callback configured in Google Cloud Console.

#### `GET /api/auth/google`

Starts the OAuth flow (redirect to the provider).

- **503** if OAuth is not configured.

#### `GET /api/auth/callback`

Google callback (Passport redirects automatically).

---

#### Local auth (email + password)

#### `POST /api/auth/register`

Creates a new account with email and password.

**JSON body**

```json
{
  "email": "user@example.com",
  "password": "min8chars",
  "name": "First Last"
}
```

**Response**

- **201** — User created and session started:
  ```json
  { "user": { "id": "...", "email": "...", "name": "...", "avatar": null, "authProvider": "local" } }
  ```
- **400** — `VALIDATION_ERROR` (invalid email, password shorter than 8 characters, empty name).
- **409** — `CONFLICT` — email already in use.

#### `POST /api/auth/login`

Signs in with email and password.

**JSON body**

```json
{
  "email": "user@example.com",
  "password": "min8chars"
}
```

**Response**

- **200** — Session started:
  ```json
  { "user": { "id": "...", "email": "...", "name": "...", "avatar": null, "authProvider": "local" } }
  ```
- **401** — `UNAUTHORIZED` — invalid credentials.

---

#### `GET /api/auth/me`

Current session user.

- **200** — `{ "user": { "id", "email", "name", "avatar", "authProvider" } }`
- **401** — `{ "user": null }` if no session.

#### `POST /api/auth/logout`

Signs out and clears the session cookie.

- **200** — `{ "ok": true }`

---

### Teams (`/api/teams`) — no auth

#### `GET /api/teams`

Lists all teams. Paginated response.

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Team ID. |
| `name` | string | Full name. |
| `shortName` | string \| null | Short name. |
| `logoUrl` | string \| null | Crest URL. |
| `groupLabel` | string \| null | Group label. |

---

### Tournaments (`/api/tournaments`) — session required

#### `GET /api/tournaments`

Lists all active tournaments.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (cuid) | Tournament ID. |
| `name` | string | Full name (e.g. "FIFA World Cup 2026"). |
| `shortName` | string \| null | Short name (e.g. "WC 2026"). |
| `leagueId` | number | Bzzoiro league ID. |
| `seasonIds` | string | Comma-separated season IDs. |
| `isDefault` | boolean | Whether this is the default tournament. |
| `active` | boolean | Whether the tournament is active. |

#### `GET /api/tournaments/:id`

Single tournament by ID.

- **404** if not found.

---

### Fixtures (`/api/fixtures`) — no auth

All fixture endpoints accept an optional `?tournamentId=<id>` query param to scope results to a specific tournament. If omitted, the default tournament is used.

#### `GET /api/fixtures`

Lists matches stored in Postgres. Paginated response.

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Event ID. |
| `date` | string (ISO) | Kick-off time. |
| `round` | string \| null | Phase label. |
| `groupLabel` | string \| null | Group label (e.g. "Group A"). |
| `status` | string | `not_started`, `in_progress`, `finished`, `postponed`, `cancelled`. |
| `homeScore` | number \| null | Home goals. |
| `awayScore` | number \| null | Away goals. |
| `homeTeam` | object \| null | `{ id, name, shortName, logoUrl }` |
| `awayTeam` | object \| null | `{ id, name, shortName, logoUrl }` |

#### `GET /api/fixtures/live`

Live matches from Bzzoiro v2. Paginated response. **Redis cache 60 s.**

#### `GET /api/fixtures/standings`

Standings from Bzzoiro v2. Paginated response. **Redis cache 900 s.**

---

### Predictions (`/api/predictions`) — session required

#### `GET /api/predictions`

Lists the authenticated user’s predictions. Paginated response.

| Field | Type |
|-------|------|
| `id` | string (cuid) |
| `fixtureId` | number |
| `homeGoals` | number |
| `awayGoals` | number |
| `points` | number \| null |
| `createdAt` | string (ISO) \| null |

#### `POST /api/predictions`

Creates or updates the user’s prediction for a `fixtureId`. Implemented as an atomic upsert (`ON CONFLICT DO UPDATE`) to avoid duplicate rows under concurrency.

> **Predictions lock once the match has started** (`status !== 'not_started'`).

**JSON body**

```json
{ "fixtureId": 204851, "homeGoals": 2, "awayGoals": 1 }
```

- **201** — Prediction saved.
- **400** — `VALIDATION_ERROR`.
- **404** — `NOT_FOUND` — fixture not found.
- **409** — `CONFLICT` — match already started.

---

### Global leaderboard (`/api/leaderboard`) — session required

#### `GET /api/leaderboard`

Global ranking of all users by total points. Paginated response.

```json
{
  "count": 25,
  "next": null,
  "previous": null,
  "results": [
    { "id": "...", "name": "Nico", "avatar": "...", "totalPoints": 42 },
    ...
  ]
}
```

---

### Mini leagues (`/api/mini-leagues`) — session required (except where noted)

Private user groups with their own leaderboard. Each league has a static 8-character invite code and can also generate shareable invite links that expire after 7 days.

#### `POST /api/mini-leagues`

Creates a league. The creator becomes `owner`.

**JSON body**

```json
{ "name": "Los Cracks" }
```

- **201** — League created with `id` and `inviteCode`.
- **500** — `INTERNAL_ERROR` — DB insert failed.

#### `GET /api/mini-leagues/mine`

Lists leagues the user belongs to (as owner or member). Paginated response.

#### `GET /api/mini-leagues/:id`

League detail with member list.

- **403** if you are not a member.
- **404** if it does not exist.

```json
{
  "id": "...",
  "name": "Los Cracks",
  "inviteCode": "AB12CD34",
  "creatorId": "...",
  "members": [
    { "id": "...", "name": "Nico", "avatar": "...", "role": "owner" }
  ]
}
```

#### `POST /api/mini-leagues/join` or `POST /api/mini-leagues/:id/join`

Join a league with the static invite code.

**JSON body**

```json
{ "code": "AB12CD34" }
```

- **201** — Joined successfully.
- **404** — Invalid code.
- **409** — Already a member.

#### `DELETE /api/mini-leagues/:id`

Delete a league (owner only). Deletes all members atomically.

#### `DELETE /api/mini-leagues/:id/leave`

Leave a league. The owner cannot leave (they must delete the league).

#### `DELETE /api/mini-leagues/:id/members/:userId`

Remove a member (owner only).

#### `GET /api/mini-leagues/:id/leaderboard`

Member ranking for the league. Members only. Paginated response with `rank`.

```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    { "id": "...", "name": "Nico", "avatar": "...", "totalPoints": 42, "rank": 1 },
    ...
  ]
}
```

---

#### Invite links

##### `GET /api/mini-leagues/invite/:token` — **no auth required**

Returns public info about the league for a given invite token. Used to show the league name before the user logs in.

- **200**:
  ```json
  { "id": "...", "name": "Los Cracks", "expiresAt": "2026-05-22T15:00:00.000Z" }
  ```
- **404** — `NOT_FOUND` — token not found or expired.

##### `POST /api/mini-leagues/:id/invite` — owner only

Generates a new invite link for the league (expires in **7 days**). Invalidates the previous token if one existed.

- **200**:
  ```json
  { "token": "abc123...", "expiresAt": "2026-05-22T15:00:00.000Z" }
  ```
- **403** — `FORBIDDEN` — requester is not the owner.
- **404** — `NOT_FOUND` — league not found.

##### `POST /api/mini-leagues/join-by-token` — session required

Join a league using an invite link token.

**JSON body**

```json
{ "token": "abc123..." }
```

- **201** — Joined successfully: `{ "league": { "id", "name" }, "member": { ... } }`
- **400** — `VALIDATION_ERROR` — token missing.
- **404** — `NOT_FOUND` — token not found or expired.
- **409** — `CONFLICT` — already a member.

---

## Scoring

Points are calculated automatically when a match reaches `finished`. The `score-sync` job runs every 60 s and detects the transition.

| Case | Points |
|------|--------|
| Exact score (predicted 2-1, result 2-1) | **5** |
| Correct winner (predicted 2-0, result 3-1) | **3** |
| Correct draw (predicted 1-1, result 0-0) | **1** |
| Anything else | **0** |

Scoring is **idempotent**: only predictions with `points IS NULL` are scored. The job includes past dates to handle delays from the external API.

---

## Bzzoiro integration (quick reference)

| Use | BSD v2 endpoint |
|-----|-----------------|
| Live matches | `GET /v2/events/?status=inprogress&limit=200` |
| Standings | `GET /v2/leagues/{leagueId}/standings/` |

---

## Useful scripts

- **`pnpm seed`** — Seed fixtures from Bzzoiro. Priority: `BZZOIRO_EVENTS_*` (date range) → `BZZOIRO_FIXTURE_SEASON_IDS` → `BZZOIRO_LEAGUE_ID` alone → `TOURNAMENT_ID`. See `.env.example`.
- **`pnpm db:push`** — Apply the Drizzle schema to the database.

---

## Local run

From **`backend/`**:

```bash
pnpm install
pnpm dev
```

From the **monorepo root**:

```bash
pnpm dev:backend
```

Configure `.env`, apply schema (`pnpm db:push`). Redis is optional (live/standings cache; sessions use memory in development).
