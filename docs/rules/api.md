# Rules: API

Prescriptive rules for the Express backend API. These apply to every new or modified endpoint.

## Auth

- Protected routes must use the `requireAuth` middleware
- JWT is validated from `Authorization: Bearer <token>` header
- Never trust `req.user` without `requireAuth` in the middleware chain
- The `/api/auth/exchange` endpoint is the only path that issues JWTs
- One-time codes expire in ≤60 seconds and are single-use

## Request Validation

- All user-controlled inputs on write endpoints (POST, PUT, PATCH) must be validated with Zod
- Return 400 with `{ error: string, details?: ZodIssue[] }` on validation failure
- Read-only endpoints (GET) do not need Zod unless they accept query params that affect DB queries
- Fixture IDs and user IDs from URL params must be validated as integers/cuid2 before DB access

## Response Shape

### Success
```json
{ "data": ... }
```
or for collections:
```json
{ "count": number, "results": [...] }
```

### Error
```json
{ "error": "Human-readable message" }
```

Never expose stack traces, internal field names (e.g. `googleId`, `password_hash`), or DB error messages in responses.

### Auth responses
`GET /api/auth/me` returns only: `{ id, email, name, avatar }` — nothing else.

## Error Handling

- All async handlers wrapped with `asyncHandler(fn)` — no try/catch inside handlers
- Global error middleware in `index.ts` handles all unhandled errors
- Production (`NODE_ENV=production`): return `{ error: "Internal server error" }` with 500, no stack trace
- Development: include `error.message` in the response for debugging

## Route Naming

- Collection: `GET /api/fixtures`
- Single resource: `GET /api/fixtures/:id`
- Action on resource: `POST /api/fixtures/:id/predict`
- Auth: `GET /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/exchange`
- Snake_case for multi-word resources: `/api/mini_leagues`

## Cache

- Fixture list and leaderboard responses are cached via `CacheService`
- After any write that changes fixture scores or prediction points, call `CacheService.invalidate()` for the affected keys
- Cache TTLs are defined in `CacheService` — do not set TTLs elsewhere

## Auth Endpoints Reference

Base path: `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/google` | Public | Inicia OAuth con Google |
| `GET` | `/callback` | Public | Callback OAuth Google |
| `GET` | `/exchange` | Public | Intercambia one-time code por JWT |
| `POST` | `/register` | Public | Registro local (email + password) |
| `POST` | `/login` | Public | Login local |
| `POST` | `/logout` | Required | Logout (invalida sesión client-side) |
| `POST` | `/forgot-password` | Public | Envía email de reset (siempre 200) |
| `POST` | `/reset-password` | Public | Setea nueva contraseña con token |
| `GET` | `/me` | Required | Datos del usuario autenticado |
| `PATCH` | `/me` | Required | Actualizar nombre/avatar |
| `DELETE` | `/me` | Required | Eliminar cuenta |
| `POST` | `/change-password` | Required | Cambiar contraseña (requiere la actual) |

### Forgot / Reset Password

**`POST /api/auth/forgot-password`**
```json
// Body
{ "email": "user@example.com" }

// Siempre responde 200 (no revela si el email existe)
{ "ok": true }
```
- Envía email desde `prodeazoapp@gmail.com` con link a `/reset-password?token=...`
- Token válido **1 hora**, un solo uso
- Funciona para cuentas locales **y** Google (permite setear contraseña por primera vez)
- Si el usuario Google nunca tuvo contraseña, el email dice "Configurá tu contraseña"

**`POST /api/auth/reset-password`**
```json
// Body
{ "token": "<cuid2>", "password": "nueva_password" }

// 200 OK
{ "ok": true }

// 400 — password < 8 chars
// 404 — token inválido, vencido o ya usado
```

### Variables de entorno requeridas

```
SMTP_USER=prodeazoapp@gmail.com
SMTP_PASS=<gmail_app_password>   # sin espacios
```

---

## What Not to Do

- Do not import Drizzle or `pg` in routes or controllers — use model functions
- Do not compute prediction points in controllers — use `scoring.ts`
- Do not hardcode CORS origins — read from `env.ts` (`FRONTEND_URL`)
- Do not add new environment variables without updating `backend/.env.example`

---

## Mini-Leagues API Reference

Base path: `/api/mini-leagues`

### Join methods — two independent paths

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/join` | Required | Join by **invite code** (short, permanent, 8 chars uppercase) |
| `POST` | `/join-by-token` | Required | Join by **invite token** (CUID2, expires in 7 days) |

#### POST `/join` — join by invite code
```json
// Body
{ "code": "ABC12345" }

// 200 OK
{ "league": { "id": "...", "name": "..." }, "member": { ... } }

// 404 — code not found
// 409 — already a member
```

#### POST `/join-by-token` — join by invite token
```json
// Body
{ "token": "<cuid2>" }

// 200 OK
{ "league": { "id": "...", "name": "..." }, "member": { ... } }

// 404 — token not found or expired
// 409 — already a member
```

### Invite token lifecycle

| Field | Type | Description |
|-------|------|-------------|
| `inviteCode` | 8-char uppercase string | Permanent. Generated at league creation. Never expires. Used for manual code entry. |
| `inviteToken` | CUID2 string | Temporary. Generated on-demand by owner. Expires **7 days** from generation. Used for shareable URLs. |
| `inviteExpiresAt` | timestamp | Set together with `inviteToken`. Validated server-side: `inviteExpiresAt > now()`. |

Each call to `POST /:id/invite` overwrites the previous token and resets the 7-day clock.

### Shareable invite URL format

```
{origin}/join?token={inviteToken}
```

Generated client-side in `frontend/src/app/(main)/leagues/[id]/page.tsx`. The `/join` page (`frontend/src/app/join/page.tsx`) reads `?token=` from the query string, calls `GET /api/mini-leagues/invite/:token` (public, no auth) to display league info, then `POST /join-by-token` when the user confirms.

### Frontend smart-join logic

The join modal in `frontend/src/app/(main)/leagues/page.tsx` accepts any of:
1. Full URL (`https://.../join?token=...`) → extracts token → `POST /join-by-token`
2. Raw token (>8 chars) → `POST /join-by-token`
3. Short code (≤8 chars) → `POST /join`

### Other endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/mine` | Required | List leagues the authenticated user belongs to |
| `POST` | `/` | Required | Create a new league |
| `GET` | `/:id` | Required | League detail (members list, inviteCode) |
| `GET` | `/:id/leaderboard` | Required | Ranked member list with total points |
| `POST` | `/:id/invite` | Required (owner) | Generate a new invite token; returns `{ token, expiresAt }` |
| `DELETE` | `/:id/leave` | Required | Leave a league (non-owners) |
| `DELETE` | `/:id/members/:userId` | Required (owner) | Remove a specific member |
| `DELETE` | `/:id` | Required (owner) | Delete the league |
| `GET` | `/invite/:token` | **Public** | Fetch league name + expiry for a token without joining |

> ⚠️ `DELETE /:id/leave` is the correct leave endpoint. The frontend helper `leaveLeague()` in `frontend/src/api/mini-leagues.ts` incorrectly calls `/members/me` — needs to be fixed to `/leave`.
