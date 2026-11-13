/**
 * Issue an API key from the command line — for staging, before (or without) the
 * admin page: `pnpm api:key "MABFC directory: staging"`.
 *
 * Prints the key once. It is stored only as a hash, so if it's lost the answer
 * is to issue another and revoke this one.
 *
 * `bb_live_` on a production environment, `bb_test_` anywhere else, decided by
 * `VERCEL_ENV`. It writes to whatever `DATABASE_URL` is in `.env.local`, so
 * check which database that is before handing the key to anyone.
 */
import { issueKey } from '../lib/api/keys'

async function main() {
  const name = process.argv.slice(2).join(' ').trim()
  if (!name) {
    console.error('Usage: pnpm api:key "<what the key is for>"')
    process.exit(1)
  }

  const issued = await issueKey(name, 'cli')
  console.log(`✓ Issued "${name}" (${issued.id})`)
  console.log(`\n  ${issued.key}\n`)
  console.log('Shown once — it is not stored. Send it to its owner now.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
