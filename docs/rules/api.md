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

## What Not to Do

- Do not import Drizzle or `pg` in routes or controllers — use model functions
- Do not compute prediction points in controllers — use `scoring.ts`
- Do not hardcode CORS origins — read from `env.ts` (`FRONTEND_URL`)
- Do not add new environment variables without updating `backend/.env.example`
