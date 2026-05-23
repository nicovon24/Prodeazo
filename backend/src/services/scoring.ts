export type ScoringWeights = {
  pointsExact: number
  pointsWinnerOnly: number
  pointsDraw: number
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  pointsExact: 5,
  pointsWinnerOnly: 3,
  pointsDraw: 1,
}

function outcomeSign(home: number, away: number): -1 | 0 | 1 {
  if (home === away) return 0
  return home > away ? 1 : -1
}

export function calculatePredictionPoints(
  homePred: number,
  awayPred: number,
  homeRes: number | null,
  awayRes: number | null,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): number {
  if (homeRes === null || awayRes === null) return 0
  if (homePred === homeRes && awayPred === awayRes) return weights.pointsExact

  const actual = outcomeSign(homeRes, awayRes)
  const predicted = outcomeSign(homePred, awayPred)

  if (actual !== predicted) return 0
  return homeRes === awayRes ? weights.pointsDraw : weights.pointsWinnerOnly
}
