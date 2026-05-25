type JsonObject = Record<string, unknown>

function singleFetchTimeoutMs(): number {
  const n = Number(process.env.BZZOIRO_FETCH_TIMEOUT_MS)
  return Number.isFinite(n) && n > 0 ? n : 30_000
}

/** Max wall time for `getAllPages` when caller does not pass `signal` (avoids hanging `/api/fixtures` overlay). */
function paginatedFetchTimeoutMs(): number {
  const n = Number(process.env.BZZOIRO_PAGINATED_FETCH_TIMEOUT_MS)
  return Number.isFinite(n) && n > 0 ? n : 120_000
}

export class ProviderHttpError extends Error {
  constructor(message: string, readonly status: number, readonly url: string) {
    super(message)
    this.name = 'ProviderHttpError'
  }
}

export type ProviderHttpClientOptions = {
  baseUrl: string
  headers?: HeadersInit
}

export class ProviderHttpClient {
  private readonly baseUrl: string
  private readonly headers: HeadersInit

  constructor(options: ProviderHttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '')
    this.headers = options.headers ?? {}
  }

  async get<T = unknown>(
    path: string,
    params: Record<string, string | number | boolean | undefined> = {},
    init?: { signal?: AbortSignal }
  ): Promise<T> {
    const url = this.buildUrl(path, params)
    const signal = init?.signal ?? AbortSignal.timeout(singleFetchTimeoutMs())
    const response = await fetch(url, { headers: this.headers, signal })

    if (!response.ok) {
      const hint =
        response.status === 401
          ? 'Unauthorized (401): invalid or expired API key. Copy only the secret from https://sports.bzzoiro.com/dashboard/ (not the word Token). If you already use Token in the value, upgrade the app — it now strips a duplicate prefix. Optional: BZZOIRO_AUTH_SCHEME=Bearer. Env: BZZOIRO_API_KEY in backend/.env.local.'
          : `Provider request failed with ${response.status}.`
      throw new ProviderHttpError(hint, response.status, url)
    }

    try {
      return (await response.json()) as T
    } catch (error) {
      throw new Error(`Provider returned invalid JSON for ${url}: ${error}`)
    }
  }

  /**
   * @param usePageQuery - BSD `/events/` and `/live/` use limit-offset pagination (see docs); sending `page` can yield empty or wrong pages. Set `false` for those paths.
   */
  async getAllPages<T = unknown>(
    path: string,
    params: Record<string, string | number | boolean | undefined> = {},
    maxPagesOrOptions:
      | number
      | { maxPages?: number; usePageQuery?: boolean; signal?: AbortSignal } = 50
  ): Promise<T[]> {
    const options =
      typeof maxPagesOrOptions === 'number'
        ? { maxPages: maxPagesOrOptions, usePageQuery: true, signal: undefined as AbortSignal | undefined }
        : {
            maxPages: maxPagesOrOptions.maxPages ?? 50,
            usePageQuery: maxPagesOrOptions.usePageQuery ?? true,
            signal: maxPagesOrOptions.signal,
          }
    const { maxPages, usePageQuery, signal: callerSignal } = options
    const listSignal = callerSignal ?? AbortSignal.timeout(paginatedFetchTimeoutMs())

    const results: T[] = []
    let nextPath: string | null = path
    let page = 1

    const requestParams = (
      resolvedPath: string,
      pageNum: number
    ): Record<string, string | number | boolean | undefined> => {
      if (resolvedPath !== path) {
        return {}
      }
      if (usePageQuery) {
        return { ...params, page: pageNum }
      }
      return { ...params }
    }

    while (nextPath && page <= maxPages) {
      const payload: JsonObject = await this.get<JsonObject>(
        nextPath,
        requestParams(nextPath, page),
        { signal: listSignal }
      )

      const pageResults = Array.isArray(payload.results)
        ? (payload.results as T[])
        : Array.isArray(payload.response)
          ? (payload.response as T[])
          : Array.isArray(payload)
            ? (payload as T[])
            : []

      results.push(...pageResults)

      // Stop early on empty page — avoids an extra request when total is an exact multiple of pageSize
      if (pageResults.length === 0) break

      const next: string | null = typeof payload.next === 'string' ? payload.next : null
      nextPath = next ? stripBasePath(next, this.baseUrl) : null
      page += 1
    }

    if (page > maxPages) {
      throw new Error(`Provider pagination exceeded ${maxPages} pages for ${path}`)
    }

    return results
  }

  private buildUrl(
    path: string,
    params: Record<string, string | number | boolean | undefined>
  ): string {
    const url = path.startsWith('http')
      ? new URL(path)
      : new URL(`${this.baseUrl}/${path.replace(/^\/+/, '')}`)

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }

    return url.toString()
  }
}

function stripBasePath(url: string, baseUrl: string): string {
  if (!url.startsWith('http')) return url
  const parsed = new URL(url)
  const base = new URL(baseUrl)
  if (parsed.origin !== base.origin) return url
  const basePath = base.pathname.replace(/\/+$/, '')
  const path =
    basePath && parsed.pathname.startsWith(basePath)
      ? parsed.pathname.slice(basePath.length) || '/'
      : parsed.pathname
  return `${path}${parsed.search}`
}
