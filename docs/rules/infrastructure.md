# Rules: Infrastructure & Environment

## Deployment Topology

| Service | Platform | URL pattern |
|---------|----------|------------|
| Frontend | Vercel | `*.vercel.app` → custom domain |
| Backend | Render | `*.onrender.com` → custom domain |
| Database (prod) | Supabase PostgreSQL | connection string via `DATABASE_URL` |
| Database (local) | Docker Compose | `localhost:5432` |

**Cross-origin constraint:** Frontend and backend are on different domains. This is why JWT (not cookies) is used — see `ARCHITECTURE.md` ADR-001.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `POSTGRES_USER` | Yes (Docker) | Docker Compose DB user |
| `POSTGRES_PASSWORD` | Yes (Docker) | Docker Compose DB password |
| `POSTGRES_DB` | Yes (Docker) | Docker Compose DB name |
| `JWT_SECRET` | Yes | Secret for signing JWTs (min 32 chars) |
| `JWT_EXPIRY` | No | Token expiry (default: `7d`) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Yes | Full callback URL (e.g. `http://localhost:4000/api/auth/callback`) |
| `FRONTEND_URL` | Yes | Used for CORS and post-auth redirects |
| `BZZOIRO_API_KEY` | Yes | Bzzoiro BSD API key |
| `BZZOIRO_BASE_URL` | Yes | `https://sports.bzzoiro.com/api` |
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | No | Backend port (default: 4000) |

**Removed variables (do not reference):** `SESSION_SECRET`, `COOKIE_SECURE`, `TOURNAMENT_ID`, `BZZOIRO_LEAGUE_ID`

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend base URL (e.g. `http://localhost:4000`) |

## Rules

- **Every new env var must be added to `backend/.env.example` in the same PR**
- `backend/src/env.ts` is the single validation point — app exits with code 1 if a required var is missing
- Never hardcode URLs, secrets, or API keys anywhere except env files (which are gitignored)
- Render env vars must be updated manually in the Render dashboard when new vars are added

## Local Development

```bash
# 1. Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env   # if exists

# 2. Fill in secrets (JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BZZOIRO_API_KEY)

# 3. Start infrastructure
docker compose up -d

# 4. Seed tournament data
cd backend && pnpm seed

# 5. Start frontend
cd frontend && pnpm dev
```

Verify Docker services are healthy:
```bash
docker compose ps
```

## Google OAuth Setup

Local authorized JS origins:
```
http://localhost:3000
http://localhost:4000
```

Local redirect URIs:
```
http://localhost:4000/api/auth/callback
```

## Docker Compose Services

| Service | Port | Notes |
|---------|------|-------|
| `postgres` | 5432 | Persists data in named volume |
| `backend` | 4000 | Rebuilds on `docker compose up --build` |
| `migrate` | — | Runs once on startup, then exits |

Frontend is **not** in Docker — run with `pnpm dev` locally.

## Render Deploy

- Backend auto-deploys on push to `master`
- Build command: `pnpm build`
- Start command: `pnpm start`
- Migrations: run `pnpm db:push` manually via Render shell after schema changes, or add to startup script

## What Not to Do

- Do not add `SESSION_SECRET` or any cookie-session variable — auth is JWT
- Do not commit `.env` files — they are in `.gitignore`
- Do not run `docker compose down -v` in production workflows — it deletes the DB volume
- Do not expose the backend port (4000) directly to the internet in production — Render handles TLS termination
