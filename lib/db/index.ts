import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

/**
 * Lazy on purpose, and **not** via a Proxy.
 *
 * `neon()` throws when `DATABASE_URL` is unset, and Next evaluates top-level
 * module code at build time — so creating the client at module scope crashes
 * `next build` before the variable exists. A Proxy is the tempting fix and the
 * wrong one: it breaks libraries that inspect the adapter object, and it fails
 * as a hang with no error, which is a miserable thing to debug. A plain
 * function is enough.
 */
function createDb() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Run `vercel env pull .env.local --yes` — and note that ' +
        'drizzle-kit and tsx do not read .env.local on their own, so scripts need ' +
        '`dotenv -e .env.local -- …`.',
    )
  }
  return drizzle(neon(url), { schema })
}

let db: ReturnType<typeof createDb> | null = null

export function getDb() {
  if (!db) db = createDb()
  return db
}

export { schema }
