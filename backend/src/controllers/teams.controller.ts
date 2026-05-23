import type { Request, Response } from 'express'
import * as teamModel from '../models/team.model'
import { paginate } from '../utils/paginate'

export async function list(req: Request, res: Response) {
  const all = await teamModel.findAllTeams()
  res.json(paginate(all, req))
}
