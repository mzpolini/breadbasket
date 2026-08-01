#!/usr/bin/env npx tsx

import { upsertUser } from '@/lib/storage/users'

/**
 * Bootstrap script: make a Clerk user an admin.
 *
 * Run with:
 *   npx tsx scripts/make-admin.ts <clerk-id-or-email>
 *
 * Example:
 *   npx tsx scripts/make-admin.ts user_2i5z9qH5k8L4m9p0
 */
async function main() {
  const arg = process.argv[2]
  if (!arg) {
    console.error('Usage: npx tsx scripts/make-admin.ts <clerk-id>')
    console.error('Example: npx tsx scripts/make-admin.ts user_2i5z9qH5k8L4m9p0')
    process.exit(1)
  }

  console.log(`Creating admin user: ${arg}`)

  const user = await upsertUser(arg, 'admin', undefined, undefined)
  console.log(`✓ User ${arg} is now an admin`)
  console.log(`  Role: ${user.role}`)
  console.log(`  Created: ${user.createdAt}`)
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
