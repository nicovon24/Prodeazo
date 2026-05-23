import { findTournamentById, findDefaultTournament } from '../models/tournament.model'

export async function resolveTournament(tournamentId?: string) {
  if (tournamentId) {
    const t = await findTournamentById(tournamentId)
    if (!t) return null
    return t
  }
  return findDefaultTournament()
}
