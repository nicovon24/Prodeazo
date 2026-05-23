import type { Request } from 'express'

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export function paginate<T>(items: T[], req: Request): PaginatedResponse<T> {
  const pageParam = req.query.page
  const limitParam = req.query.limit

  if (!pageParam) {
    return { count: items.length, next: null, previous: null, results: items }
  }

  const page = Math.max(1, parseInt(String(pageParam), 10) || 1)
  const limit = Math.min(200, Math.max(1, parseInt(String(limitParam), 10) || 20))
  const total = items.length
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit
  const results = items.slice(start, start + limit)

  const buildUrl = (p: number) => `${req.path}?page=${p}&limit=${limit}`

  return {
    count: total,
    next: page < totalPages ? buildUrl(page + 1) : null,
    previous: page > 1 ? buildUrl(page - 1) : null,
    results,
  }
}
