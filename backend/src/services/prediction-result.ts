import { calculatePredictionPoints, DEFAULT_SCORING_WEIGHTS } from './scoring'

export type PredictionResultTone = 'exact' | 'partial' | 'miss'

export function classifyPredictionTone(
  homePred: number,
  awayPred: number,
  homeRes: number | null,
  awayRes: number | null,
  storedPoints?: number | null
): PredictionResultTone {
  if (homeRes === null || awayRes === null) return 'miss'

  if (homePred === homeRes && awayPred === awayRes) return 'exact'

  const points =
    storedPoints ??
    calculatePredictionPoints(homePred, awayPred, homeRes, awayRes, DEFAULT_SCORING_WEIGHTS)

  if (points >= DEFAULT_SCORING_WEIGHTS.pointsExact) return 'exact'
  if (points > 0) return 'partial'
  return 'miss'
}
