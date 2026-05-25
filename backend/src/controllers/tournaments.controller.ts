import type { Request, Response } from 'express'
import { findActiveTournaments, findTournamentById } from '../models/tournament.model'
import { err } from '../utils/apiError'

export async function list(_req: Request, res: Response) {
  const result = await findActiveTournaments()
  res.json({
    tournaments: result.map(t => ({
      id: t.id,
      name: t.name,
      shortName: t.shortName,
      leagueId: t.leagueId,
      seasonIds: t.seasonIds,
      isDefault: t.isDefault,
    })),
  })
}

export async function getOne(req: Request, res: Response) {
  const id = req.params.id as string
  const tournament = await findTournamentById(id)
  if (!tournament) return res.status(404).json(err('NOT_FOUND', 'Tournament not found'))
  res.json({
    id: tournament.id,
    name: tournament.name,
    shortName: tournament.shortName,
    leagueId: tournament.leagueId,
    seasonIds: tournament.seasonIds,
    isDefault: tournament.isDefault,
    active: tournament.active,
    createdAt: tournament.createdAt,
  })
}
