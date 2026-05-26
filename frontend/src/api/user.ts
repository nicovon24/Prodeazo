import { apiFetch } from './client'
import type { User } from '../store/useAuthStore'

export async function updateProfile(name: string, avatar?: string | null): Promise<User> {
  const body: { name: string; avatar?: string } = { name }
  if (avatar !== undefined) {
    body.avatar = avatar ?? ''
  }

  const { user } = await apiFetch<{ user: User }>('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return user
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiFetch('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export async function deleteAccount(): Promise<void> {
  await apiFetch('/api/auth/me', {
    method: 'DELETE',
  })
}
