import type { Request, Response } from 'express'
import * as leaderboardModel from '../models/leaderboard.model'
import { paginate } from '../utils/paginate'

export async function list(req: Request, res: Response) {
  const rows = await leaderboardModel.findLeaderboardAggregates()

  const sorted = rows
    .filter((r) => r.totalPoints !== null)
    .sort((a, b) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0))

  res.json(paginate(sorted, req))
}
