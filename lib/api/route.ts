import { createHash } from 'node:crypto'
import { authenticateApiKey } from './keys'
import { rateLimitHeaders } from './key-format'
import { checkRateLimit } from './rate-limit'
import type { ErrorCode } from './contract'

/**
 * The one way a public API route is written.
 *
 * `apiRoute` is the door: the key is checked and the request counted **before**
 * the handler runs, so a handler cannot forget to, and nothing is read from the
 * database for a caller who is refused. What it does for the handler:
 *
 * - 401 for no or unknown key, 403 for a revoked one — no rate headers, since
 *   there is no key to have a limit.
 * - 429 with `Retry-After` once the minute's budget is spent.
 * - `RateLimit-*` on everything after that.
 * - The handler returns a body or throws `ApiError`; `Cache-Control`, a weak
 *   `ETag` and `304 Not Modified` are applied here, the same for every route.
 */

export class ApiError extends Error {
  constructor(
    readonly status: 400 | 404,
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message)
  }
}

export type ApiResult = {
  body: unknown
  /**
   * What the ETag is a hash of, if not the body. A bulk response carries a
   * `generated_at` that changes on every call, which would make a `304` impossible.
   */
  etagOf?: unknown
}

export const CACHE_CONTROL = 'private, max-age=300'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { ...JSON_HEADERS, 'Cache-Control': 'no-store', ...headers },
  })
}

/** A weak validator: the same data is the same tag, whoever asks. */
export function etagFor(value: unknown): string {
  const hash = createHash('sha256').update(JSON.stringify(value)).digest('base64url').slice(0, 27)
  return `W/"${hash}"`
}

/** Whether `If-None-Match` names this tag. Weak comparison, as the spec asks for GET. */
export function matchesEtag(header: string | null, etag: string): boolean {
  if (!header) return false
  const bare = (tag: string) => tag.trim().replace(/^W\//, '')
  return header.trim() === '*' || header.split(',').some((tag) => bare(tag) === bare(etag))
}

export function apiRoute<Context = unknown>(
  handler: (req: Request, context: Context, now: Date) => Promise<ApiResult>,
): (req: Request, context: Context) => Promise<Response> {
  return async (req, context) => {
    const auth = await authenticateApiKey(req)
    if (!auth.ok) {
      return auth.status === 403
        ? errorResponse(403, 'key_revoked', 'This API key has been revoked.')
        : errorResponse(401, 'unauthorized', 'A valid API key is required.')
    }

    const now = new Date()
    const limit = await checkRateLimit(auth.keyId, now)
    const rate = rateLimitHeaders(limit)
    if (!limit.allowed) {
      return errorResponse(
        429,
        'rate_limited',
        'Rate limit exceeded. Retry after the number of seconds in Retry-After.',
        rate,
      )
    }

    try {
      const { body, etagOf } = await handler(req, context, now)
      const etag = etagFor(etagOf ?? body)
      const headers = { ...rate, 'Cache-Control': CACHE_CONTROL, ETag: etag }

      if (matchesEtag(req.headers.get('if-none-match'), etag)) {
        return new Response(null, { status: 304, headers })
      }
      return new Response(JSON.stringify(body), { status: 200, headers: { ...JSON_HEADERS, ...headers } })
    } catch (error) {
      if (error instanceof ApiError) return errorResponse(error.status, error.code, error.message, rate)
      throw error
    }
  }
}
