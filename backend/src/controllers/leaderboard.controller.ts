import type { Request, Response } from 'express'
import * as leaderboardModel from '../models/leaderboard.model'
import * as dashboardModel from '../models/dashboard.model'
import { paginate } from '../utils/paginate'

export async function list(req: Request, res: Response) {
  const rows = await leaderboardModel.findLeaderboardAggregates()

  // totalPoints is always a number (COALESCE ensures 0 for users without scored predictions)
  const sorted = rows.sort((a, b) => b.totalPoints - a.totalPoints)

  res.json(paginate(sorted, req))
}

export async function me(req: Request, res: Response) {
  const userId = (req.user as { id: string }).id
  const [stats, globalRank] = await Promise.all([
    dashboardModel.getUserScoredPredictionStats(userId),
    dashboardModel.getUserGlobalRank(userId),
  ])
  res.json({ ...stats, globalRank })
}

export async function meHistory(req: Request, res: Response) {
  const userId = (req.user as { id: string }).id
  const history = await leaderboardModel.findUserPointsHistory(userId)
  res.json({ results: history })
}
