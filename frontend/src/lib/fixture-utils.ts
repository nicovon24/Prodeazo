import type { Fixture } from '@/api/fixtures'
import type { Prediction } from '@/api/predictions'

export type FixtureSortMode = 'recommended' | 'kickoff_asc' | 'kickoff_desc'

const STATUS_SORT_ORDER: Record<string, number> = {
  in_progress: 0,
  inprogress: 0,
  not_started: 1,
  ns: 1,
  finished: 2,
  ft: 2,
  postponed: 3,
  cancelled: 4,
}

export function formatFixturePhase(f: Fixture): string {
  if (f.groupLabel?.trim()) return f.groupLabel.trim()
  if (f.round?.trim()) return f.round.trim()
  return '—'
}

export function sortFixtures(fixtures: Fixture[], mode: FixtureSortMode): Fixture[] {
  const list = [...fixtures]
  if (mode === 'kickoff_asc') {
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }
  if (mode === 'kickoff_desc') {
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
  return list.sort((a, b) => {
    const oa = STATUS_SORT_ORDER[a.status] ?? 9
    const ob = STATUS_SORT_ORDER[b.status] ?? 9
    if (oa !== ob) return oa - ob
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })
}

export type PredictionBadgeTone = 'none' | 'neutral' | 'exact' | 'partial' | 'miss'

function outcomeSign(home: number, away: number): -1 | 0 | 1 {
  if (home === away) return 0
  return home > away ? 1 : -1
}

export function getPredictionBadgeTone(
  fixture: Fixture,
  prediction?: Prediction
): PredictionBadgeTone {
  if (!prediction) return 'none'

  const homeRes = fixture.homeScore
  const awayRes = fixture.awayScore
  const isFinished = fixture.status === 'finished' || fixture.status === 'ft'
  const isLive = fixture.status === 'in_progress' || fixture.status === 'inprogress'

  if (!isFinished && !isLive) return 'neutral'

  if (homeRes === null || awayRes === null) return 'neutral'

  const { homeGoals, awayGoals } = prediction
  if (homeGoals === homeRes && awayGoals === awayRes) return 'exact'

  if (outcomeSign(homeRes, awayRes) === outcomeSign(homeGoals, awayGoals)) {
    return homeRes === awayRes ? 'partial' : 'partial'
  }
  return 'miss'
}

export function formatPredictionScore(prediction?: Prediction): string {
  if (!prediction) return '-'
  return `${prediction.homeGoals} - ${prediction.awayGoals}`
}
