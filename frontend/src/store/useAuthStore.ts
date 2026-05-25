import { create } from 'zustand'
import { apiFetch, API_BASE_URL } from '../api/client'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string | null
  authProvider?: 'local' | 'google' | string
}

const TOKEN_KEY = 'auth_token'

function parseJwtPayload(token: string): (User & { exp: number }) | null {
  try {
    const base64 = token.split('.')[1]
    // Add padding required by atob for base64url-encoded strings
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(json)
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      avatar: payload.avatar ?? null,
      authProvider: payload.authProvider ?? null,
      exp: payload.exp,
    }
  } catch {
    return null
  }
}

function isTokenValid(token: string): boolean {
  const payload = parseJwtPayload(token)
  if (!payload) return false
  return Date.now() / 1000 < payload.exp
}

function loadUserFromStorage(): User | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  const payload = parseJwtPayload(token)
  if (!payload) return null
  if (Date.now() / 1000 > payload.exp) {
    localStorage.removeItem(TOKEN_KEY)
    return null
  }
  const { exp: _exp, ...user } = payload
  return user
}

interface AuthState {
  user: User | null
  loading: boolean
  setTokenAndUser: (token: string) => void
  fetchMe: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loginWithGoogle: () => void
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,

  setTokenAndUser: (token: string) => {
    if (token.length > 4096) {
      localStorage.removeItem(TOKEN_KEY)
      set({ user: null, loading: false })
      return
    }
    localStorage.setItem(TOKEN_KEY, token)
    const user = loadUserFromStorage()
    set({ user, loading: true })
    void get().fetchMe()
  },

  fetchMe: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
    if (!token || !isTokenValid(token)) {
      localStorage.removeItem(TOKEN_KEY)
      set({ user: null, loading: false })
      return
    }
    set({ loading: true })
    try {
      const { user } = await apiFetch<{ user: User }>('/api/auth/me')
      set({ user, loading: false })
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      set({ user: null, loading: false })
    }
  },

  login: async (email, password) => {
    set({ loading: true })
    try {
      const { user, token } = await apiFetch<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      localStorage.setItem(TOKEN_KEY, token)
      set({ user, loading: false })
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },

  register: async (name, email, password) => {
    set({ loading: true })
    try {
      const { user, token } = await apiFetch<{ user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      })
      localStorage.setItem(TOKEN_KEY, token)
      set({ user, loading: false })
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },

  logout: async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Token is removed regardless of server response
    }
    localStorage.removeItem(TOKEN_KEY)
    set({ user: null })
  },

  loginWithGoogle: () => {
    const base = API_BASE_URL || ''
    window.location.href = `${base}/api/auth/google`
  },
  setUser: (user) => set({ user }),
}))
