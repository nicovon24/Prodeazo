export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiErrorPayload {
  error: {
    code: string
    message: string
  }
}

export class ApiError extends Error {
  status: number
  code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`
}

/** Legacy JWTs embedded multi‑MB avatars and triggered HTTP 431 on API calls. */
const MAX_TOKEN_CHARS = 4096

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem('auth_token')
  if (!token) return null
  if (token.length > MAX_TOKEN_CHARS) {
    localStorage.removeItem('auth_token')
    return null
  }
  return token
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(apiUrl(path), {
    ...options,
    headers,
  })

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }

    let payload: ApiErrorPayload | null = null

    try {
      payload = await res.json()
    } catch {
      // Keep the fallback below when the backend cannot return JSON.
    }

    throw new ApiError(
      res.status,
      payload?.error.message || `API error ${res.status}`,
      payload?.error.code,
    )
  }

  if (res.status === 204) return undefined as T

  return res.json()
}
