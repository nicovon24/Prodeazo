# VISION.md — Prodeazo

## Product Definition

Prodeazo is a prediction pool platform starting with the 2026 FIFA World Cup and designed to scale to any tournament. The core value proposition is simple: **predict match scorelines, earn points, compete with friends**.

## Target User

Football fans who follow international tournaments. They want to make predictions quickly, check their ranking against friends, and feel the tension of each match through their predictions — not through betting money.

## Business Domain

| Concept | Definition |
|---------|-----------|
| **Fixture** | A scheduled match with two teams, a date, and an outcome |
| **Prediction** | A user's scoreline guess for a fixture, locked once the match starts |
| **Points** | Earned automatically when a fixture finishes: 5 (exact), 3 (correct winner), 1 (draw guessed), 0 (wrong) |
| **Leaderboard** | Global ranking of users by total points |
| **Mini League** | Private group with its own leaderboard, joined via invite code |
| **Tournament** | The competition being predicted (WC 2026 is the default) |

## Product Phases

### Phase 1 — MVP (current focus)
Core prediction loop: sign in → see fixtures → predict scores → earn points → check ranking.

- Fixture list with match status (not started / in progress / finished)
- Prediction input (locked once match starts)
- Global leaderboard
- User profile with prediction history
- Google OAuth login

### Phase 2 — Social Layer
- Mini leagues with invite codes
- League-specific leaderboards
- User vs user comparison view
- Tournament prediction picks (champion, top scorer)

### Phase 3 — Data & Expansion
- Match statistics and events
- Team and player profiles
- Multi-tournament support
- Admin panel for score adjustments

## Constraints

- **Deadline:** Product must be functional before World Cup 2026 kickoff
- **Scale:** MVP targets hundreds of users, not millions — no distributed infra needed yet
- **Data source:** Bzzoiro BSD is the primary fixture/score provider; API-Football is the documented fallback
- **No real-money betting** — points only, no financial transactions

## Design Principles (Karpathy-aligned)

1. **Think Before Coding** — write a SPEC before any implementation
2. **Simplicity First** — in-memory cache over Redis, `setInterval` over cron, one process over microservices
3. **Surgical Changes** — change what the task requires, nothing else
4. **Goal-Driven Execution** — every PR closes a requirement, not just adds code
