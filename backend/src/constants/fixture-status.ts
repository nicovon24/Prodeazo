/** Canonical `fixtures.status` values stored in Postgres and returned by the API. */
export const FixtureStatus = {
  NotStarted: 'not_started',
  InProgress: 'in_progress',
  Finished: 'finished',
  Postponed: 'postponed',
  Cancelled: 'cancelled',
} as const

export type FixtureStatus = (typeof FixtureStatus)[keyof typeof FixtureStatus]

const CANONICAL = new Set<string>(Object.values(FixtureStatus))

const FINISHED_SYNONYMS = new Set([
  'ft',
  'finished',
  'fulltime',
  'full-time',
  'aet',
  'pen',
])

const IN_PROGRESS_SYNONYMS = new Set([
  'inprogress',
  'live',
  'in_play',
  '1h',
  '2h',
  'ht',
  '1st_half',
  '2nd_half',
  'halftime',
  'extratime',
  'penalties',
])

const NOT_STARTED_SYNONYMS = new Set([
  'ns',
  'scheduled',
  'notstarted',
  'not_started',
  'tbd',
])

/** Map live-scores API / provider raw status strings to canonical DB status. Unknown → null (do not overwrite). */
export function normalizeScoresRowStatus(raw: unknown): FixtureStatus | null {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : null
  if (!s) return null
  if (FINISHED_SYNONYMS.has(s)) return FixtureStatus.Finished
  if (IN_PROGRESS_SYNONYMS.has(s)) return FixtureStatus.InProgress
  if (NOT_STARTED_SYNONYMS.has(s)) return FixtureStatus.NotStarted
  if (s === 'postponed' || s === 'pst') return FixtureStatus.Postponed
  if (s === 'cancelled' || s === 'canceled' || s === 'cancel' || s === 'can')
    return FixtureStatus.Cancelled
  if (CANONICAL.has(s)) return s as FixtureStatus
  return null
}

export function predictionsOpen(status: string | null | undefined): boolean {
  const s = status?.trim().toLowerCase()
  return s === FixtureStatus.NotStarted || s === 'ns'
}

/** Treat DB row as terminal / scored (canonical or legacy). */
export function isFinishedStoredStatus(status: string | null | undefined): boolean {
  const s = status?.trim().toLowerCase() ?? ''
  return s === FixtureStatus.Finished || s === 'ft'
}

/** Fixtures polled for score updates (legacy `NS` / `ns` recognized until migrated). */
export function isActiveForScoreSync(status: string | null | undefined): boolean {
  const s = status?.trim().toLowerCase() ?? ''
  return (
    s === FixtureStatus.NotStarted ||
    s === FixtureStatus.InProgress ||
    s === 'ns' ||
    s === 'inprogress'
  )
}
