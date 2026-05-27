import { apiFetch } from './client'

export interface PaginatedResponse<T> {
  count: number
  results: T[]
  next: string | null
  previous: string | null
}

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

export interface MyLeagueRow {
  league: MiniLeague
  role: 'owner' | 'member'
}

export interface LeagueDetail extends MiniLeague {
  members: Array<{ id: string; name: string; avatar: string | null; role: 'owner' | 'member' }>
}

export interface LeagueLeaderboardEntry {
  id: string
  name: string
  avatar: string | null
  totalPoints: number
  rank: number
}

export function getMyLeagues(): Promise<PaginatedResponse<MyLeagueRow>> {
  return apiFetch('/api/mini-leagues/mine')
}

export function createLeague(name: string): Promise<MiniLeague> {
  return apiFetch('/api/mini-leagues', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function joinByCode(code: string): Promise<{ league: MiniLeague; member: MiniLeagueMember }> {
  return apiFetch('/api/mini-leagues/join', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

export function getLeagueDetail(leagueId: string): Promise<LeagueDetail> {
  return apiFetch(`/api/mini-leagues/${leagueId}`)
}

export function getLeagueLeaderboard(leagueId: string): Promise<PaginatedResponse<LeagueLeaderboardEntry>> {
  return apiFetch(`/api/mini-leagues/${leagueId}/leaderboard`)
}

export function leaveLeague(leagueId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/mini-leagues/${leagueId}/members/me`, { method: 'DELETE' })
}

export function deleteLeague(leagueId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/mini-leagues/${leagueId}`, { method: 'DELETE' })
}
