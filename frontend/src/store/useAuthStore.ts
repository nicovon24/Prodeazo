import { create } from 'zustand'
import { apiFetch } from '../api/client'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  authProvider?: 'local' | 'google' | string
}

interface AuthState {
  user: User | null
  loading: boolean
  fetchMe: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  fetchMe: async () => {
    try {
      const { user } = await apiFetch<{ user: User | null }>('/api/auth/me')
      console.log('[AuthStore] fetchMe success:', !!user)
      set({ user, loading: false })
    } catch (err) {
      console.error('[AuthStore] fetchMe error:', err)
      set({ user: null, loading: false })
    }
  },

  login: async (email, password) => {
    const { user } = await apiFetch<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    console.log('[AuthStore] login success')
    set({ user, loading: false })
  },

  register: async (name, email, password) => {
    const { user } = await apiFetch<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    set({ user, loading: false })
  },

  logout: async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    set({ user: null })
  },

  setUser: (user) => set({ user }),
}))
