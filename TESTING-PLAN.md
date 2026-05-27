# PLAN — QA Testing: feat/functionality

**Goal:** Verify end-to-end that every feature shipped in `feat/functionality` works correctly
in both local dev and production (Vercel + Render + Supabase).

**Branch base:** `master` (merged from `feat/functionality` + `doc/improve`)
**Date:** 2026-05-26

---

## Available tournaments

| Tournament | leagueId | seasonId | Match status | Best for |
|------------|----------|----------|--------------|----------|
| **FIFA World Cup 2026** *(default)* | 27 | 188 | All `not_started` (starts June 11) | UI, groups, rounds |
| **Brasileirão Serie A 2026** ⭐ | 9 | 28 | ✅ Finished (May 24-25) + `not_started` (May 30-31) | **Test scoring without DB trick** |
| **UEFA Champions League 2025/26** ⭐ | 7 | 268 | Final PSG vs Arsenal on May 30 (`not_started`) | High-profile prediction |

> To seed Brasileirão and UCL locally, add them to `backend/src/scripts/tournaments.config.ts`
> and run `docker compose build migrate && docker compose run --rm --no-deps migrate npm run seed`.

---

## Scoring system (quick reference)

| Result | Points |
|--------|--------|
| Exact scoreline | **5 pts** |
| Correct winner | **3 pts** |
| Correct draw (wrong scoreline) | **1 pt** |
| Incorrect | **0 pts** |

---

## Block 1 — Local setup

**Estimated time:** 5 min

### Steps

1. Make sure you are on `master`:
   ```bash
   git checkout master
   ```

2. Copy env files (if not already done):
   ```powershell
   Copy-Item -Path "envs\back\.env" -Destination "backend\.env" -Force
   Copy-Item -Path "envs\front\.env" -Destination "frontend\.env" -Force
   ```

3. Start the infrastructure:
   ```bash
   docker compose up -d
   docker compose ps
   curl http://localhost:4000/api/health
   # → {"ok":true}
   ```

4. Run the seed (loads all configured tournaments):
   ```bash
   docker compose build migrate
   docker compose run --rm --no-deps migrate npm run seed
   ```

5. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

### Verify
- [ ] `http://localhost:4000/api/health` → `{"ok":true}`
- [ ] `http://localhost:3000` loads the landing page

---

## Block 2 — Auth (Google OAuth → JWT)

**Estimated time:** 3 min

### Steps

1. Go to `http://localhost:3000`
2. Click "Login with Google" (or the landing CTA)
3. Complete the Google OAuth flow
4. Verify redirect lands on `/home` (not `/login`)
5. Open DevTools → Application → Local Storage → `http://localhost:3000`
   - A JWT key must be present
6. Reload the page — session must persist (no re-login required)
7. Navigate to `/login` while logged in — must redirect to `/home`

### Verify
- [ ] Post-OAuth redirect goes to `/home`
- [ ] JWT present in localStorage
- [ ] Session survives a full page reload (F5)
- [ ] `/login` redirects to `/home` when already authenticated

---

## Block 3 — Fixture page + tournament selector

**Estimated time:** 10 min

### Steps

1. Go to `http://localhost:3000/fixture`
2. Verify the **tournament selector** appears at the top (when more than 1 tournament is seeded)
3. Switch to **Brasileirão Serie A 2026** — Brazilian teams should load
4. Switch to **UEFA Champions League 2025/26** — the PSG vs Arsenal final (May 30) should be visible
5. Switch back to **FIFA World Cup 2026** — groups and rounds of the World Cup
6. Check team logos are visible in all tournaments
7. Check fixtures are sorted by date in each tournament

### Verify
- [ ] Tournament selector is visible and functional
- [ ] Each tournament shows its own fixtures
- [ ] Team logos are visible (not broken)
- [ ] Sorted by date correctly
- [ ] Rounds / groups visible in WC2026; matchdays in Brasileirão

---

## Block 4 — Predictions (Brasileirão — May 30-31 matches)

**Estimated time:** 10 min  
**Recommended league:** Brasileirão Serie A 2026

These matches are ideal: they are `not_started` right now, but on May 30-31 you will get real
results and the scoring job will assign points automatically.

**Available matches to predict (May 30-31):**
- Flamengo vs Coritiba (May 30)
- Grêmio vs Corinthians (May 30)
- Bahia vs Botafogo (May 30)
- Athletico vs Mirassol (May 30)
- Palmeiras vs Chapecoense (May 31)
- Cruzeiro vs Fluminense (May 31)
- Santos vs Vitória (May 31)
- and more...

**Bonus — Champions League Final:**
- PSG vs Arsenal (May 30) in UCL → predict the final

### Steps

1. Go to `http://localhost:3000/predictions`
2. Select the **Brasileirão Serie A 2026** tournament
3. Find a match on May 30 or 31
4. Enter a scoreline using the `ScoreInput`
5. Save the prediction
6. Reload — it must persist
7. Edit the scoreline — it must update (not duplicate)
8. Repeat for at least 3 different matches
9. Switch to **UCL** and predict PSG vs Arsenal

### Verify
- [ ] Predictions are saved across all tournaments
- [ ] `ScoreInput` rejects negatives and non-numbers
- [ ] Editing updates without duplicating
- [ ] Prediction persists after reload
- [ ] Already-started or finished matches cannot be predicted

---

## Block 5 — Scoring with Brasileirão (no DB trick needed)

**Estimated time:** 5 min setup + wait until May 30-31

The **Brasileirão already has finished matches** from May 24-25:
- Flamengo vs Palmeiras ✅ finished
- Corinthians vs Atlético Mineiro ✅ finished
- Vasco da Gama vs Red Bull Bragantino ✅ finished
- Coritiba vs Bahia ✅ finished
- Remo vs Athletico ✅ finished
- Cruzeiro vs Chapecoense ✅ finished

**Recommended path:** Predict today → wait until Sunday May 31 → the score-sync job assigns
points automatically when Bzzoiro updates the results.

**Fast path (DB trick):** If you want to see points working right now:

1. Connect to the local DB:
   ```bash
   docker compose exec db psql -U postgres -d prodeazo
   ```

2. Find a Brasileirão fixture you predicted:
   ```sql
   SELECT f.id, f.status, f.home_score, f.away_score
   FROM fixtures f
   JOIN tournaments t ON f.tournament_id = t.id
   WHERE t.name LIKE '%Brasileiro%'
   AND f.status = 'not_started'
   LIMIT 5;
   ```

3. Mark it as finished with a result:
   ```sql
   UPDATE fixtures
   SET status = 'finished', home_score = 2, away_score = 1
   WHERE id = <fixture_id>;
   ```

4. Restart the backend to force the sync:
   ```bash
   docker compose restart backend
   ```

5. Verify points were assigned:
   ```sql
   SELECT p.home_goals, p.away_goals, p.points, f.home_score, f.away_score
   FROM predictions p
   JOIN fixtures f ON p.fixture_id = f.id
   WHERE f.id = <fixture_id>;
   ```

### Verify
- [ ] `predictions.points` is set after a fixture transitions to `finished`
- [ ] Points = 5 for exact scoreline
- [ ] Points = 3 for correct winner only
- [ ] Points = 1 for correct draw (wrong scoreline)
- [ ] Running the sync again does not change points (idempotent)

---

## Block 6 — Home Dashboard

**Estimated time:** 5 min  
**Prerequisite:** Block 4 (have predictions) + ideally Block 5 (have points)

### Steps

1. Go to `http://localhost:3000/home`
2. Check the **3 top cards** (global tournament stats):
   - Total matches / matches played / goals scored
3. Check the **"Pending predictions"** panel: matches you have not predicted yet
4. Check the **"Upcoming with prediction"** panel: upcoming matches you already predicted
5. Check the **"Recent results"** panel: finished matches with your prediction and earned points

### Verify
- [ ] Top cards show real numbers (not 0 / null)
- [ ] "Pending" panel lists matches without your prediction
- [ ] "Upcoming" panel lists matches you predicted
- [ ] "Recent" panel shows the correct points badge after Block 5

---

## Block 7 — Settings Page

**Estimated time:** 5 min

### Steps

1. Go to `http://localhost:3000/settings`
2. Verify the page loads your user data (name, avatar, email)
3. Edit your display name
4. Save — verify it persists after reload
5. Check the notifications / preferences section if present

### Verify
- [ ] Page loads without errors
- [ ] User data is pre-populated
- [ ] Edits persist after F5
- [ ] No 401 / 500 errors in DevTools → Network

---

## Block 8 — Production smoke test

**Estimated time:** 5 min  
**URL:** Vercel app (production)

> In production, the seed must be run against Supabase to have all 3 tournaments available.
> Until that is done, only WC2026 is available in prod.

### Steps

1. Open the Vercel URL
2. Log in with Google → verify JWT in localStorage
3. Go to `/fixture` → verify data loads from Render (not mock)
4. Make a prediction
5. Check `/home` → it should appear in "Upcoming with prediction"

### Verify
- [ ] Auth works in prod (cross-origin Vercel → Render)
- [ ] Real fixtures from Bzzoiro BSD
- [ ] Prediction persists in Supabase PostgreSQL
- [ ] No CORS errors in Network tab

---

## Acceptance criteria summary

| Block | Key criterion |
|-------|--------------|
| 1 - Setup | Health check passes, tournaments seeded |
| 2 - Auth | JWT in localStorage, session persists |
| 3 - Fixture | Tournament selector works, logos visible, real data |
| 4 - Predictions | Full CRUD across all tournaments, validation works |
| 5 - Scoring | Points calculated correctly (Brasileirão May 30-31 or DB trick) |
| 6 - Dashboard | All 3 panels show real user data |
| 7 - Settings | User data editable and persistent |
| 8 - Prod | Full auth + data flow on Vercel/Render |

---

## Recommended testing order

```
1. Setup (Block 1)
2. Auth (Block 2)
3. Fixture + tournament selector (Block 3) — check all 3 tournaments
4. Predict Brasileirão matches May 30-31 (Block 4)
5. Predict PSG vs Arsenal UCL Final (Block 4 bonus)
6. DB trick to see points right away (Block 5 — optional)
7. Dashboard with your predictions (Block 6)
8. Settings (Block 7)
9. Production smoke test (Block 8)
10. Wait until Sunday May 31 → real Brasileirão points assigned automatically
```
