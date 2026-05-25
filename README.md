# Prodeazo

Plataforma de pronósticos y estadísticas de fútbol (Mundial 2026, Premier League y más torneos vía selector).


## Desarrollo local

**Guía paso a paso (rama, `envs/`, Docker, seed, frontend):** [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)

Resumen:

1. Copiar `envs/back/.env` → `backend/.env` y `envs/front/.env` → `frontend/.env`
2. `docker compose up -d` (API en `http://localhost:4000`)
3. `docker compose run --rm --no-deps migrate pnpm seed`
4. `cd frontend && npm run dev` → `http://localhost:3000`

## Stack

- **Frontend:** Next.js, TypeScript, Tailwind
- **Backend:** Express, Drizzle, PostgreSQL, Redis
- **Datos deportivos:** Bzzoiro API
- **Infra local:** Docker Compose

## Features (visión)

- Fixtures y resultados por torneo
- Predicciones y ranking
- Miniligas con invitaciones
- Auth (local + Google OAuth)

## Roadmap de alto nivel
- **Fase 1 (MVP):** foco en predicciones + ranking.
- **Fase 2:** miniligas y panel administrativo.
- **Fase 3:** módulo estadístico completo y expansión multi-torneo.

> Objetivo: la versión inicial estará ideada para terminarse antes del inicio del Mundial 2026,
> y luego evolucionará como producto reusable para otros torneos.
