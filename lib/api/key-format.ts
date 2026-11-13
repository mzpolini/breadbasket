import { createHash } from 'node:crypto'

/**
 * What an API key looks like and how it is recognised — pure, no database.
 */

export type KeyEnvironment = 'live' | 'test'

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const SECRET_LENGTH = 32

/** `bb_live_` or `bb_test_`, then the secret. */
const KEY_PATTERN = /^bb_(?:live|test)_[0-9A-Za-z]{32}$/

/** How much of a key is kept visible: `bb_live_` plus four characters of the secret. */
export const PREFIX_LENGTH = 12

/** Production issues live keys; everything else — preview, dev, a laptop — issues test keys. */
export function keyEnvironment(vercelEnv: string | undefined): KeyEnvironment {
  return vercelEnv === 'production' ? 'live' : 'test'
}

/**
 * `bb_<env>_` plus 32 base-62 characters — about 190 bits, far past guessing.
 * Rejection sampling (248 is the largest multiple of 62 under 256) so every
 * character is equally likely.
 */
export function generateKey(
  environment: KeyEnvironment,
  randomBytes: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n)),
): string {
  let secret = ''
  while (secret.length < SECRET_LENGTH) {
    for (const byte of randomBytes(SECRET_LENGTH * 2)) {
      if (byte >= 248) continue
      secret += BASE62[byte % BASE62.length]
      if (secret.length === SECRET_LENGTH) break
    }
  }
  return `bb_${environment}_${secret}`
}

/** What is stored in place of the key. Unsalted on purpose: it has to be findable by the hash. */
export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export function keyPrefix(key: string): string {
  return key.slice(0, PREFIX_LENGTH)
}

/** A shape check, so a request with obvious garbage never reaches the database. */
export function looksLikeKey(key: string): boolean {
  return KEY_PATTERN.test(key)
}

/** The token from `Authorization: Bearer <token>`, or null if there isn't one. */
export function bearerToken(header: string | null): string | null {
  const match = header?.match(/^Bearer\s+(\S+)\s*$/i)
  return match ? match[1] : null
}

const WINDOW_MS = 60 * 1000

/** The minute a request falls in — the row it is counted on. */
export function windowStart(now: Date): Date {
  return new Date(Math.floor(now.getTime() / WINDOW_MS) * WINDOW_MS)
}

export type RateStatus = {
  allowed: boolean
  limit: number
  remaining: number
  /** Seconds until the minute rolls over, at least 1. */
  resetSeconds: number
}

/**
 * Where a key stands after this request was counted. `count` includes it: the
 * 60th request of a minute is allowed, the 61st is not.
 */
export function rateStatus(count: number, limit: number, now: Date): RateStatus {
  const resetMs = windowStart(now).getTime() + WINDOW_MS - now.getTime()
  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    resetSeconds: Math.max(1, Math.ceil(resetMs / 1000)),
  }
}

/** The `RateLimit-*` headers, and `Retry-After` once the limit is hit. */
export function rateLimitHeaders(status: RateStatus): Record<string, string> {
  return {
    'RateLimit-Limit': String(status.limit),
    'RateLimit-Remaining': String(status.remaining),
    'RateLimit-Reset': String(status.resetSeconds),
    ...(status.allowed ? {} : { 'Retry-After': String(status.resetSeconds) }),
  }
}
