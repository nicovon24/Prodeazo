import type { Request, Response } from 'express'
import { z } from 'zod'
import * as miniLeagueModel from '../models/mini-league.model'
import { paginate } from '../utils/paginate'
import { err } from '../utils/apiError'

const p = (v: string | string[]): string => (Array.isArray(v) ? v[0] : v)

const createSchema = z.object({
  name: z.string().min(1).max(50),
})

export async function create(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues })
  }

  const userId = (req.user as any).id
  const [league] = await miniLeagueModel.insertLeague(parsed.data.name, userId)
  if (!league) return res.status(500).json(err('INTERNAL_ERROR', 'Failed to create league'))
  await miniLeagueModel.insertMember(league.id, userId, 'owner')

  res.status(201).json(league)
}

export async function mine(req: Request, res: Response) {
  const userId = (req.user as any).id
  const rows = await miniLeagueModel.findLeaguesByUserId(userId)
  res.json(paginate(rows, req))
}

export async function detail(req: Request, res: Response) {
  const userId = (req.user as any).id
  const id = p(req.params.id)

  const [league] = await miniLeagueModel.findLeagueById(id)
  if (!league) return res.status(404).json(err('NOT_FOUND', 'League not found'))

  const [membership] = await miniLeagueModel.findMember(id, userId)
  if (!membership) return res.status(403).json(err('FORBIDDEN', 'Not a member of this league'))

  const members = await miniLeagueModel.findMembersByLeagueId(id)
  res.json({ ...league, members })
}

export async function join(req: Request, res: Response) {
  const userId = (req.user as any).id
  const code = String(req.body?.code ?? req.params?.code ?? '')

  if (!code) return res.status(400).json(err('VALIDATION_ERROR', 'invite_code is required'))

  const [league] = await miniLeagueModel.findLeagueByInviteCode(code)
  if (!league) return res.status(404).json(err('NOT_FOUND', 'Invalid invite code'))

  const [existing] = await miniLeagueModel.findMember(league.id, userId)
  if (existing) return res.status(409).json(err('CONFLICT', 'Already a member'))

  const [member] = await miniLeagueModel.insertMember(league.id, userId, 'member')
  res.status(201).json({ league, member })
}

export async function leave(req: Request, res: Response) {
  const userId = (req.user as any).id
  const id = p(req.params.id)

  const [membership] = await miniLeagueModel.findMember(id, userId)
  if (!membership) return res.status(404).json(err('NOT_FOUND', 'Not a member of this league'))
  if (membership.role === 'owner') {
    return res.status(409).json(err('CONFLICT', 'Owner cannot leave — delete the league instead'))
  }

  await miniLeagueModel.deleteMember(id, userId)
  res.json({ ok: true })
}

export async function removeMember(req: Request, res: Response) {
  const requesterId = (req.user as any).id
  const id = p(req.params.id)
  const userId = p(req.params.userId)

  const [requesterMembership] = await miniLeagueModel.findMember(id, requesterId)
  if (!requesterMembership || requesterMembership.role !== 'owner') {
    return res.status(403).json(err('FORBIDDEN', 'Only the owner can remove members'))
  }
  if (userId === requesterId) {
    return res.status(409).json(err('CONFLICT', 'Owner cannot remove themselves'))
  }

  const [removed] = await miniLeagueModel.deleteMember(id, userId)
  if (!removed) return res.status(404).json(err('NOT_FOUND', 'Member not found'))

  res.json({ ok: true })
}

export async function deleteLeague(req: Request, res: Response) {
  const userId = (req.user as any).id
  const id = p(req.params.id)

  const [league] = await miniLeagueModel.findLeagueById(id)
  if (!league) return res.status(404).json(err('NOT_FOUND', 'League not found'))

  const [membership] = await miniLeagueModel.findMember(id, userId)
  if (!membership || membership.role !== 'owner') {
    return res.status(403).json(err('FORBIDDEN', 'Only the owner can delete this league'))
  }

  await miniLeagueModel.deleteLeague(id)
  res.json({ ok: true })
}

export async function generateInvite(req: Request, res: Response) {
  const userId = (req.user as any).id
  const id = p(req.params.id)

  const [league] = await miniLeagueModel.findLeagueById(id)
  if (!league) return res.status(404).json(err('NOT_FOUND', 'League not found'))

  const [membership] = await miniLeagueModel.findMember(id, userId)
  if (!membership || membership.role !== 'owner') {
    return res.status(403).json(err('FORBIDDEN', 'Only the owner can generate invite links'))
  }

  const [updated] = await miniLeagueModel.generateInviteToken(id)
  res.json({ token: updated.inviteToken, expiresAt: updated.inviteExpiresAt })
}

export async function getInviteInfo(req: Request, res: Response) {
  const token = String(req.params.token ?? '')
  const [league] = await miniLeagueModel.findLeagueByToken(token)
  if (!league) return res.status(404).json(err('NOT_FOUND', 'Invite link not found or expired'))
  res.json({ id: league.id, name: league.name, expiresAt: league.inviteExpiresAt })
}

export async function joinByToken(req: Request, res: Response) {
  const userId = (req.user as any).id
  const token = String(req.body?.token ?? '')

  if (!token) return res.status(400).json(err('VALIDATION_ERROR', 'token is required'))

  const [league] = await miniLeagueModel.findLeagueByToken(token)
  if (!league) return res.status(404).json(err('NOT_FOUND', 'Invite link not found or expired'))

  const [existing] = await miniLeagueModel.findMember(league.id, userId)
  if (existing) return res.status(409).json(err('CONFLICT', 'Already a member'))

  const [member] = await miniLeagueModel.insertMember(league.id, userId, 'member')
  res.status(201).json({ league: { id: league.id, name: league.name }, member })
}

export async function leaderboard(req: Request, res: Response) {
  const userId = (req.user as any).id
  const id = p(req.params.id)

  const [membership] = await miniLeagueModel.findMember(id, userId)
  if (!membership) return res.status(403).json(err('FORBIDDEN', 'Not a member of this league'))

  const rows = await miniLeagueModel.findLeagueLeaderboard(id)
  const sorted = rows
    .map((r) => ({ ...r, totalPoints: r.totalPoints ?? 0 }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((r, i) => ({ ...r, rank: i + 1 }))

  res.json(paginate(sorted, req))
}
