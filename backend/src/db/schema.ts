import { FixtureStatus } from '../constants/fixture-status'
import { pgTable, text, integer, timestamp, unique, boolean } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

export const teams = pgTable('teams', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  shortName: text('short_name'),
  logoUrl: text('logo_url'),
  groupLabel: text('group_label'),
})

/** Grupos / pools privados del prode. Creados por usuarios. */
export const miniLeagues = pgTable('mini_leagues', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  inviteCode: text('invite_code').unique().notNull().$defaultFn(() => createId().slice(0, 8).toUpperCase()),
  inviteToken: text('invite_token').unique(),
  inviteExpiresAt: timestamp('invite_expires_at'),
  creatorId: text('creator_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  tournamentId: text('tournament_id').references(() => tournaments.id),
})

export const miniLeagueMembers = pgTable(
  'mini_league_members',
  {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    leagueId: text('mini_league_id').notNull().references(() => miniLeagues.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    role: text('role').notNull().default('member'), // 'owner' | 'member'
    joinedAt: timestamp('joined_at').defaultNow(),
  },
  (t) => [unique().on(t.leagueId, t.userId)]
)

export const tournaments = pgTable('tournaments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  shortName: text('short_name'),
  leagueId: integer('league_id').notNull(),
  seasonIds: text('season_ids').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

export const fixtures = pgTable('fixtures', {
  id: integer('id').primaryKey(),
  homeTeamId: integer('home_team_id').references(() => teams.id),
  awayTeamId: integer('away_team_id').references(() => teams.id),
  date: timestamp('date').notNull(),
  round: text('round'),
  /** BSD v2 `round_number` (e.g. group stage vs knockout ordering). */
  roundNumber: integer('round_number'),
  /** BSD v2 `group_name` e.g. "Group A". */
  groupLabel: text('group_label'),
  /** BSD / API `league_id` (competition). */
  leagueId: integer('league_id'),
  seasonId: integer('season_id'),
  status: text('status').default(FixtureStatus.NotStarted),
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
  tournamentId: text('tournament_id').references(() => tournaments.id),
})

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  googleId: text('google_id').unique(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  passwordHash: text('password_hash'),
  authProvider: text('auth_provider').notNull().default('google'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const predictions = pgTable(
  'predictions',
  {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    userId: text('user_id').notNull().references(() => users.id),
    fixtureId: integer('fixture_id').notNull().references(() => fixtures.id),
    homeGoals: integer('home_goals').notNull(),
    awayGoals: integer('away_goals').notNull(),
    points: integer('points'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [unique().on(t.userId, t.fixtureId)]
)
