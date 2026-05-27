import { apiFetch } from './client'

export function forgotPassword(email: string): Promise<{ ok: boolean }> {
  return apiFetch('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function resetPassword(token: string, password: string): Promise<{ ok: boolean }> {
  return apiFetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}
