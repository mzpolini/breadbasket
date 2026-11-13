import {
  findApiKeyByHash,
  getApiKey,
  insertApiKey,
  markApiKeyRevoked,
  touchApiKey,
} from '../storage/api-keys'
import {
  bearerToken,
  generateKey,
  hashKey,
  keyEnvironment,
  keyPrefix,
  looksLikeKey,
} from './key-format'

/**
 * Issue, revoke and check API keys.
 *
 * Rotation is issue-then-revoke: there is no "regenerate", so the old key keeps
 * working until an admin decides it shouldn't.
 */

export type IssuedKey = {
  id: string
  /** The only time the plaintext exists. Not stored, not recoverable. */
  key: string
  prefix: string
}

export async function issueKey(name: string, createdBy: string): Promise<IssuedKey> {
  const key = generateKey(keyEnvironment(process.env.VERCEL_ENV))
  const id = crypto.randomUUID()
  await insertApiKey({
    id,
    name: name.trim(),
    prefix: keyPrefix(key),
    keyHash: hashKey(key),
    createdBy,
    createdAt: new Date(),
  })
  return { id, key, prefix: keyPrefix(key) }
}

/** Idempotent — revoking a revoked key leaves its original revocation time. */
export async function revokeKey(id: string): Promise<boolean> {
  if (!(await getApiKey(id))) return false
  await markApiKeyRevoked(id, new Date())
  return true
}

export type ApiAuth = { ok: true; keyId: string } | { ok: false; status: 401 | 403 }

/**
 * Who is calling. A missing, malformed or unknown key is 401; a key that was
 * real and has been revoked is 403 — the difference is what tells the directory
 * "you have a typo" from "ask an admin for a new key".
 */
export async function authenticateApiKey(req: Request): Promise<ApiAuth> {
  const token = bearerToken(req.headers.get('authorization'))
  if (!token || !looksLikeKey(token)) return { ok: false, status: 401 }

  const row = await findApiKeyByHash(hashKey(token))
  if (!row) return { ok: false, status: 401 }
  if (row.revokedAt) return { ok: false, status: 403 }

  await touchApiKey(row.id, new Date())
  return { ok: true, keyId: row.id }
}
