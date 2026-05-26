# Development Guide — Prodeazo

## Prerequisites

- **Node.js** v20+
- **Docker Desktop** (Postgres and backend run in containers)
- **Git**
- **`envs/`** folder with the real `.env` files from the team (not committed to the repo)

---

## 1. Clone and switch branch

```bash
git clone <repo>
cd Prodeazo
git fetch origin feat/functionality
git checkout feat/functionality
```

To align your local branch with the remote (discards local changes):

```bash
git checkout -B feat/functionality origin/feat/functionality
```

---

## 2. Environment variables (required: copy from `envs/`)

The real env files live in **`envs/`**. Copy them exactly to where each app reads them:

| Source | Destination |
|--------|-------------|
| `envs/back/.env` | `backend/.env` |
| `envs/front/.env` | `frontend/.env` |

**PowerShell (from the repo root):**

```powershell
Copy-Item -Path "envs\back\.env" -Destination "backend\.env" -Force
Copy-Item -Path "envs\front\.env" -Destination "frontend\.env" -Force
```

**Important rules:**

> Auth uses JWT (migrated from cookie-session in May 2026). `SESSION_SECRET`, `COOKIE_SECURE`, `TOURNAMENT_ID`, and `BZZOIRO_LEAGUE_ID` are no longer needed. See `ARCHITECTURE.md` ADR-001.

- Do not manually change ports or OAuth URLs unless the team asks. Google login depends on these matching:
  - `NEXT_PUBLIC_API_URL` in frontend (typically `http://localhost:4000`)
  - Redirect URI in Google Cloud: `http://localhost:4000/api/auth/callback`
- The `.env` files in `backend/` and `frontend/` must be **exact copies** of `envs/`. If someone sends you updated envs, copy them over again.
- The `envs/` folder can stay as a local backup; it is not committed (it is in `.gitignore` along with `backend/.env` and `frontend/.env`).

**Verify they are identical (optional):**

```powershell
(Get-FileHash "envs\back\.env").Hash -eq (Get-FileHash "backend\.env").Hash
(Get-FileHash "envs\front\.env").Hash -eq (Get-FileHash "frontend\.env").Hash
```

> **Note on the database:** a teammate's `DATABASE_URL` might point to a different port (e.g. `5433`). Docker Compose **overrides** the connection inside the containers (`5432`, host `db`). That is why the **seed** must be run via Docker (see section 4), not with `npm run seed` on the host if your `.env` does not point to the Docker Postgres.

---

## 3. Install dependencies (frontend on the host)

The root only has a minimal workspace. Install inside each folder:

```bash
cd backend
npm install

cd ../frontend
npm install
```

(`pnpm` works too if you have it; on Windows `npm` is often more reliable.)

---

## 4. Docker: start the infrastructure

From the **repo root**:

```bash
docker compose up -d
```

Verify:

```bash
docker compose ps
curl http://localhost:4000/api/health
# → {"ok":true}
```

### Rebuild from scratch (stale images / volumes)

```bash
docker compose down -v --remove-orphans
docker compose build --no-cache
docker compose up -d
```

`down -v` wipes the DB; you will need to re-run the **seed** (section 5) afterwards.

### Port 4000 blocked on Windows

If `docker compose up` fails with *"bind … 4000"* or *"socket not permitted"*, Windows often reserves the range **4000–4099**. **Do not change** the backend or frontend port for OAuth.

Open **PowerShell as Administrator** and run:

```powershell
netsh int ipv4 set dynamicport tcp start=49152 num=16384
netsh int ipv6 set dynamicport tcp start=49152 num=16384
net stop winnat
net start winnat
```

Then, in a normal terminal:

```bash
docker compose up -d
```

### Google Cloud Console (reference)

Authorised JS origins: `http://localhost:3000`, `http://localhost:4000`  
Redirect URI: `http://localhost:4000/api/auth/callback`

---

## 5. Tournament seed (World Cup 2026 + Premier League)

Tournaments are defined in `backend/src/scripts/tournaments.config.ts` (defaults: **FIFA World Cup 2026** and **Premier League 2025/26**).

**Always run the seed inside Docker** (uses the compose DB and the `.env` API key mounted there):

```bash
# From the repo root
docker compose run --rm --no-deps migrate pnpm seed
```

This:

1. Creates / updates records in the `tournaments` table
2. Loads teams and fixtures from Bzzoiro
3. Enables the tournament selector in **Fixture** (when more than one tournament exists)

Test data without an API key:

```bash
docker compose run --rm --no-deps migrate pnpm seed:mock
```

To add another tournament, edit `tournaments.config.ts` and run the same command again.

---

## 6. Frontend (local development on the host)

```bash
cd frontend
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)  
API (Docker): [http://localhost:4000](http://localhost:4000)

Restart `npm run dev` after changing `frontend/.env`.

---

## 7. Full flow (summary)

```text
1. git checkout feat/functionality
2. Copy envs/back/.env → backend/.env  and  envs/front/.env → frontend/.env
3. npm install in backend/ and frontend/
4. docker compose up -d
5. docker compose run --rm --no-deps migrate pnpm seed
6. cd frontend && npm run dev
7. Login (Google) → Fixture → tournament selector
```

---

## Useful commands

```bash
docker compose logs -f backend
docker compose up --build -d backend
docker compose restart
docker compose down          # stop, keep volumes
docker compose down -v       # stop and wipe DB (re-seed afterwards)
```

---

## Troubleshooting

| Problem | What to check |
|---------|---------------|
| `redirect_uri_mismatch` (Google) | Ports 4000/3000 unchanged; `.env` copied from `envs/`; URI in Google Console |
| Seed fails with `ECONNREFUSED` on host | Use `docker compose run … pnpm seed`, not `npm run seed` in `backend/` |
| Backend won't start on 4000 | Reserved port range on Windows (section 3) |
| Fixture has no matches | Seed not run or tournament has no data in Bzzoiro |
| Placeholders in World Cup (W101, 1A…) | Normal until Bzzoiro has real nations; re-run seed |

---

## Tournaments — adding a new one

Edit `backend/src/scripts/tournaments.config.ts` and find the `leagueId` / `seasonId` in the Bzzoiro API. Then:

```bash
docker compose run --rm --no-deps migrate pnpm seed
```
