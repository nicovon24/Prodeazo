# CURRENT.md — Project State

> First document any new session should read. Reflects real project state today.

---

## Last Updated: 2026-05-27 (evening)

---

## Recent Work Summary

### UI Polish Sprint (evening session)
- **Header sticky:** `sticky top-0 z-40 backdrop-blur-md` — stays visible while scrolling.
- **Content offset:** all `<main>` elements have `pt-4 md:pt-6` so content starts below navbar.
- **Sidebar mobile:** drawer now opens below the navbar (`top-16`, `h-[calc(100vh-4rem)]`).
- **CSS Modules → Tailwind:** `home.module.css`, `fixture.module.css`, `settings.module.css` deleted; all styles inlined as Tailwind.
- **Predictions mobile:** teams always side-by-side (horizontal grid at all breakpoints), fixed-size team cells (`w-[80px]` mobile / `w-[110px]` desktop).
- **Spanish country names:** `getCountryName()` used in MatchPanelRows, fixture, predictions pages.
- **Rankings:** Top 3 + user's own row. Empty state when all have 0 pts.
- **Non-interactive UI:** Ayuda, Términos, Privacidad disabled (cursor-default, reduced opacity). Notifications removed.
- **Home:** compact layout, "Pendientes" limited to 4 matches.
- **Overflow/scroll:** `main-content` uses `height:100vh + overflowY:auto`; pages scroll naturally, no content clipped.

### Earlier this session
- **Mini-leagues invite link:** fixed `/join?token=` query param bug; smart join modal accepts full URL / token / short code.
- **Rankings real data:** cumulative chart from `GET /api/leaderboard/me/history`; tie-aware rank display.
- **Forgot password:** full flow — backend (token table, SMTP Gmail), frontend pages `/forgot-password` + `/reset-password`.
- **Docker:** port 5433, `echo 'yes' | npx drizzle-kit push` for non-interactive migrations.
- **DB cleanup:** removed PL 2025/26 + Brasileirão 2026 (784 fixtures). Remaining: FIFA WC 2026 (104) + UCL 2025/26 (281).

---

## In Progress

- Nothing actively in progress.

## Known Issues

- `leaveLeague()` calls `/members/me` but backend exposes `DELETE /:id/leave` → needs fix.

## Next Tasks

- Verify password reset email delivery (SMTP Gmail credentials).
- Connect fixture page to real data.

---

## Feature Status

| Feature | Status |
|---------|--------|
| Invite link flow | ✅ Done |
| Rankings with real data | ✅ Done |
| Forgot password (full flow) | ✅ Done |
| SMTP Gmail | ✅ Configured (verify delivery) |
| Docker fix | ✅ Done |
| DB cleanup | ✅ Done |
| UI Polish Sprint | ✅ Done |
