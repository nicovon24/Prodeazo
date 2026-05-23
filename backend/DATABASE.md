# Prodeazo — Database

PostgreSQL managed with **Drizzle ORM**. Schema lives in `src/db/schema.ts`. To apply schema changes: `pnpm db:push`.

---

## Relationship diagram

```
teams ──────────────────────────────────────────┐
  │                                              │
  └─< fixtures (home_team_id, away_team_id) >───┘
        │
        └─< predictions (fixture_id)
                │
users >─────────┘ (user_id)
  │
  └─< predictions (user_id)
  │
  └─< mini_league_members (user_id)
              │
mini_leagues >┘ (mini_league_id)  [cascade delete]
```

---

## Tables

### `teams`

Tournament teams. Loaded via seed script from Bzzoiro.

| Column | Type | Constraints | Description |
|---------|------|-------------|-------------|
| `id` | integer | PK | Team ID in Bzzoiro API. |
| `name` | text | NOT NULL | Full name. |
| `short_name` | text | | Short name. |
| `logo_url` | text | | Crest URL. |
| `group_label` | text | | Group label (e.g. `Group A`). |

---

### `fixtures`

Tournament matches. Loaded via seed; the `score-sync` job updates `status`, `home_score`, and `away_score` in near real time.

| Column | Type | Constraints | Description |
|---------|------|-------------|-------------|
| `id` | integer | PK | Event ID in Bzzoiro API. |
| `home_team_id` | integer | FK → `teams.id` | Home team. |
| `away_team_id` | integer | FK → `teams.id` | Away team. |
| `date` | timestamp | NOT NULL | Match kick-off (UTC). |
| `round` | text | | Phase / round label. |
| `round_number` | integer | | Round number (for ordering). |
| `group_label` | text | | Group (e.g. `Group J`). |
| `league_id` | integer | | Competition ID in Bzzoiro. |
| `season_id` | integer | | Season ID in Bzzoiro. |
| `status` | text | DEFAULT `'not_started'` | Status: `not_started`, `in_progress`, `finished`, `postponed`, `cancelled`. |
| `home_score` | integer | | Home goals (null until underway). |
| `away_score` | integer | | Away goals. |

**`status` values:**

| Value | Meaning |
|-------|---------|
| `not_started` | Not started (predictions open) |
| `in_progress` | In progress (predictions locked) |
| `finished` | Finished (points calculated) |
| `postponed` | Postponed |
| `cancelled` | Cancelled |

If the database already had legacy values (`NS`, `FT`, `inprogress`, …), run once:

```sql
UPDATE fixtures SET status = 'not_started' WHERE lower(trim(status)) = 'ns';
UPDATE fixtures SET status = 'in_progress' WHERE lower(trim(status)) IN ('inprogress', 'live');
UPDATE fixtures SET status = 'finished' WHERE lower(trim(status)) = 'ft';
UPDATE fixtures SET status = 'postponed' WHERE lower(trim(status)) = 'pst';
UPDATE fixtures SET status = 'cancelled' WHERE lower(trim(status)) = 'can';
ALTER TABLE fixtures ALTER COLUMN status SET DEFAULT 'not_started';
```

---

### `users`

Registered users. Supports Google OAuth and local email + password authentication.

| Column | Type | Constraints | Description |
|---------|------|-------------|-------------|
| `id` | text (cuid2) | PK | Internal ID (CUID2). |
| `google_id` | text | UNIQUE, nullable | Google profile ID. Null for local users. |
| `email` | text | UNIQUE, NOT NULL | User email. |
| `name` | text | NOT NULL | Display name. |
| `avatar` | text | | Profile photo URL (Google). |
| `password_hash` | text | nullable | bcrypt hash. Null for Google users. |
| `auth_provider` | text | NOT NULL, DEFAULT `'google'` | Sign-up method: `'google'` \| `'local'`. |
| `created_at` | timestamp | DEFAULT NOW() | Created at. |

---

### `predictions`

Each user’s prediction per match. One prediction per `(user_id, fixture_id)` pair.

| Column | Type | Constraints | Description |
|---------|------|-------------|-------------|
| `id` | text (cuid2) | PK | Internal ID. |
| `user_id` | text | NOT NULL, FK → `users.id` | User who predicted. |
| `fixture_id` | integer | NOT NULL, FK → `fixtures.id` | Predicted match. |
| `home_goals` | integer | NOT NULL | Predicted home goals. |
| `away_goals` | integer | NOT NULL | Predicted away goals. |
| `points` | integer | nullable | Earned points. Null until the match finishes (`finished`). |
| `created_at` | timestamp | DEFAULT NOW() | Created at. |

**Constraints:**
- `UNIQUE (user_id, fixture_id)` — at most one prediction per user per match.

**Point rules** (computed by `score-sync` when status becomes `finished`):

| Case | Points |
|------|--------|
| Exact score | 5 |
| Correct winner / draw | 3 (winner) / 1 (draw) |
| Wrong | 0 |

---

### `mini_leagues`

Private user groups with their own leaderboard.

| Column | Type | Constraints | Description |
|---------|------|-------------|-------------|
| `id` | text (cuid2) | PK | Internal ID. |
| `name` | text | NOT NULL | League name (max 50 chars). |
| `invite_code` | text | UNIQUE, NOT NULL | 8-character invite code (e.g. `AB12CD34`). Auto-generated. |
| `creator_id` | text | NOT NULL | Creator user ID. |
| `created_at` | timestamp | DEFAULT NOW() | Created at. |

---

### `mini_league_members`

Many-to-many between users and mini leagues.

| Column | Type | Constraints | Description |
|---------|------|-------------|-------------|
| `id` | text (cuid2) | PK | Internal ID. |
| `mini_league_id` | text | NOT NULL, FK → `mini_leagues.id` ON DELETE CASCADE | League. |
| `user_id` | text | NOT NULL | Member user. |
| `role` | text | NOT NULL, DEFAULT `'member'` | `'owner'` \| `'member'`. |
| `joined_at` | timestamp | DEFAULT NOW() | Joined at. |

**Constraints:**
- `UNIQUE (mini_league_id, user_id)` — a user cannot join the same league twice.
- `ON DELETE CASCADE` — deleting the league deletes all memberships.

---

## Useful commands

```bash
# Apply schema to DB
pnpm db:push

# Drizzle Studio (visual DB explorer)
pnpm db:studio
```
