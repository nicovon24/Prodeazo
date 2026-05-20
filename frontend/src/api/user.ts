import { apiFetch } from './client'
import type { User } from '../store/useAuthStore'

export async function updateProfile(name: string, avatar?: string): Promise<User> {
  const { user } = await apiFetch<{ user: User }>('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify({ name, avatar }),
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
