import { apiFetch } from './client'

export interface MiniLeague {
  id: string
  name: string
  inviteCode: string
  creatorId: string
  createdAt: string
  tournamentId?: string
}

export interface MiniLeagueMember {
  id: string
  leagueId: string
  userId: string
  role: 'owner' | 'member'
  joinedAt: string
}

export interface InviteInfo {
  id: string
  name: string
  expiresAt: string
}

export interface GenerateInviteResponse {
  token: string
  expiresAt: string
}

export function generateInvite(leagueId: string): Promise<GenerateInviteResponse> {
  return apiFetch(`/api/mini-leagues/${leagueId}/invite`, { method: 'POST' })
}

export function getInviteInfo(token: string): Promise<InviteInfo> {
  return apiFetch(`/api/mini-leagues/invite/${token}`)
}

export function joinByToken(token: string): Promise<{ league: { id: string; name: string }; member: MiniLeagueMember }> {
  return apiFetch('/api/mini-leagues/join-by-token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}
