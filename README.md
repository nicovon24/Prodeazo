# Prodeazo (2026 FIFA World Cup Prediction Pool)

This app is designed to be a football prediction and statistics platform,
starting with the 2026 World Cup and later expanding to other tournaments.

## What is this project about?

The platform will allow users to:
- View fixtures and results in real time.
- Submit match predictions.
- Earn points for correct picks.
- Compare users on global and league-specific rankings.
- Browse stats for teams, players, and matches.

## Planned features and modules

### 1) Core module (MVP)
- **Fixture**: match list with states (pending, live, finished).
- **Predictions**: submit scorelines before kick-off.
- **Global ranking**: leaderboard sorted by total points.
- **Head-to-head**: user vs user, match by match.
- **Tournament picks**: champion / top scorer and other special picks.
- **Profile**: personal summary (correct picks, points, and history).

### 2) Mini leagues and administration (phase 2)
- **Private / public mini leagues** with invite codes.
- **Per-league leaderboard**.
- **Admin panel** for manual adjustments (results, scoring, users).

### 3) Stats module and multi-tournament expansion (phase 3)
- **Groups and knockout bracket** for the active tournament.
- **Top scorers, assisters, and advanced metrics**.
- **Match view** with events and enriched data.
- **Team and player profiles**.
- **Reusable base for adding new tournaments** (cups and international leagues).

## Stack

This app is built with:
- **Next.js + TypeScript** for the frontend.
- **Express + Drizzle + PostgreSQL** for the backend.
- **Tailwind + HeroUI** for the visual interface.
- **Google OAuth → JWT** for authentication (stored in localStorage).
- **Bzzoiro BSD** as the primary source for fixtures and results.
- **Docker Compose** for local infrastructure.

## Local development

Step-by-step guide (branch, `envs/`, Docker, seed, frontend): [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)

Quick summary:

1. Copy `envs/back/.env` → `backend/.env` and `envs/front/.env` → `frontend/.env`
2. `docker compose up -d` (API available at `http://localhost:4000`)
3. `docker compose run --rm --no-deps migrate pnpm seed`
4. `cd frontend && npm run dev` → `http://localhost:3000`

## High-level roadmap
- **Phase 1 (MVP):** focus on predictions + ranking.
- **Phase 2:** mini leagues and admin panel.
- **Phase 3:** full statistics module and multi-tournament expansion.

> Goal: the initial version is aimed to be finished before the 2026 World Cup kicks off,
> and will then evolve into a reusable product for other tournaments.
