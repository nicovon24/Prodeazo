# CURRENT.md — Project State

> This file is the first document any new session should read. It reflects the real project state today. Updated at the end of each session.

---

## Last Session (2026-05-27)

### Features shipped

#### Mini-Leagues — Invite link flow (fix + enhancement)
- **Bug fixed:** invite link was generating `/join/${token}` (path param) but the `/join` page read `?token=` (query param) → 404. Fixed to `/join?token=${token}`.
- **Smart join modal:** accepts full URL, raw token, or short code (8 chars). Auto-detects type and calls `joinByToken` or `joinByCode`. Specific error messages for 409 (already member) and 404 (invalid/expired).
- **Docs:** `docs/rules/api.md` updated with full mini-leagues endpoint table and invite flow contract.

#### Rankings — Real data + UX improvements
- **Real chart data:** new endpoint `GET /api/leaderboard/me/history` — groups predictions by day (join with fixtures), returns cumulative points. Frontend consumes and filters by tab (Weekly/Monthly/Full Tournament). Chart always starts at 0.
- **Tie-aware ranking:** table no longer uses `index + 1`. Now computes shared rank: if 3 people tie at position 2, all show "2".
- **Tab bug fixed:** "Todo el Torneo" was looking for key `'Torneo'` which never matched → fixed to `'Todo el Torneo'`.
- **Empty state:** if no scored predictions in the period, shows message instead of empty chart.

#### Home — Team name alignment
- Team names in all 3 panels (Pending, Upcoming, Recent Results) now truncate with `...` instead of breaking layout.
- CSS: `min-width: 0` on flex containers, `.teamName` with `text-overflow: ellipsis`, `.vs` with `flex-shrink: 0`.

#### Forgot Password — Full flow
- **Backend:** `password_reset_tokens` table in DB (CUID2 token, expires 1 hour, single-use), `email.service.ts` with nodemailer Gmail SMTP, two public endpoints:
  - `POST /api/auth/forgot-password` — always 200, does not reveal if email exists
  - `POST /api/auth/reset-password` — validates token, bcrypt hash, marks used
- **Google users:** if a Google-only user never had a password, they can set one for the first time via this flow. Email subject changes to "Set up your password".
- **Frontend:** pages `/forgot-password` and `/reset-password`, "Forgot your password?" link in login.
- **SMTP credentials:** `SMTP_USER=prodeazoapp@gmail.com`, `SMTP_PASS` set in `.env`.

#### Docker — Fixes
- Port `5432` was occupied by local Supabase → `docker-compose.yml` changed to `5433:5432`.
- `password_reset_tokens` table created manually in container DB (migrate service used cached image).
- Migrate command improved: `echo 'yes' | npx drizzle-kit push` to avoid interactive TTY prompts in CI/Docker.

#### Database — Cleanup
- Removed **Premier League 2025/26** and **Brasileirão Serie A 2026** tournaments, their fixtures (784 total), and 61 orphan teams.
- Remaining tournaments: **FIFA World Cup 2026** (104 fixtures) and **UEFA Champions League 2025/26** (281 fixtures).

---

## In Progress

- Nothing actively in progress.

## Blockers / Open Questions

- None.

## Feature Status

| Feature | Status |
|---------|--------|
| Invite link flow | ✅ Done |
| Rankings with real data | ✅ Done |
| Home — team alignment | ✅ Done |
| Forgot password (backend) | ✅ Done |
| Forgot password (frontend) | ✅ Done |
| SMTP Gmail | ✅ Configured (verify delivery) |
| Docker fix | ✅ Done |
| DB cleanup (PL + Brasileirao) | ✅ Done |
| Code review fixes (CR/WR/IN) | ✅ Done (2026-05-27) |
| Rankings: all users with 0pts default | ✅ Done (2026-05-27) |
| Rankings: search input functional | ✅ Done (2026-05-27) |
| Invite link expired vs used message | ✅ Done (2026-05-27) |

## Known Issues

- `leaveLeague()` in `frontend/src/api/mini-leagues.ts` calls `/members/me` but backend exposes `DELETE /:id/leave` → needs fix.

## Next Tasks

- Verify password reset email delivery with current credentials.
- Connect fixture page to real data (pending from earlier sessions).

---

*Updated: 2026-05-27 — code review fixes (14 issues), rankings shows all users with 0pts, search wired, expired invite link shows clear message*
