/**
 * The pilot-beta migration (tickets 31, 36 and 37): farm directory fields,
 * posted-by, the invitations table and the API key tables.
 *
 * Run **before** `pnpm db:push`: `pnpm db:migrate-pilot-beta`. drizzle-kit push
 * cannot add `farms.slug` on its own — it is NOT NULL and unique, and existing
 * farms have no value to give it. This adds it nullable, backfills `slug = id`
 * (so `/f/seed-farm` keeps working), then tightens it. Everything else here is
 * a nullable column or an index, added the same way push would add it.
 *
 * The `invitations` table (37) is brand new, so `db:push` would create it too;
 * it is here so one script brings a database fully up to date.
 *
 * Idempotent: every statement is guarded, so re-running is a no-op. Constraint
 * and index names match what drizzle generates from the schema, so a `db:push`
 * afterwards sees nothing left to do.
 */
import { neon } from '@neondatabase/serverless'

const STATEMENTS = [
  // Farm directory fields.
  `ALTER TABLE farms ADD COLUMN IF NOT EXISTS slug text`,
  `UPDATE farms SET slug = id WHERE slug IS NULL`,
  `ALTER TABLE farms ALTER COLUMN slug SET NOT NULL`,
  `DO $$ BEGIN
     ALTER TABLE farms ADD CONSTRAINT farms_slug_unique UNIQUE (slug);
   EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$`,
  `ALTER TABLE farms ADD COLUMN IF NOT EXISTS directory_profile_id text`,
  `DO $$ BEGIN
     ALTER TABLE farms ADD CONSTRAINT farms_directory_profile_id_unique UNIQUE (directory_profile_id);
   EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$`,
  `ALTER TABLE farms ADD COLUMN IF NOT EXISTS kyf_verified boolean NOT NULL DEFAULT false`,

  // Who said it. Null on everything written before today.
  `ALTER TABLE movements ADD COLUMN IF NOT EXISTS posted_by text`,
  `ALTER TABLE harvest_rules ADD COLUMN IF NOT EXISTS posted_by text`,
  `ALTER TABLE notes ADD COLUMN IF NOT EXISTS posted_by text`,
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS posted_by text`,
  `CREATE INDEX IF NOT EXISTS messages_farm_posted_by_seq_idx ON messages (farm_id, posted_by, seq)`,

  // Invitations (ticket 37).
  `CREATE TABLE IF NOT EXISTS invitations (
     id text PRIMARY KEY,
     email text NOT NULL,
     farm_id text NOT NULL,
     role text NOT NULL,
     clerk_invitation_id text,
     url text,
     invited_by text NOT NULL,
     invited_at timestamptz NOT NULL,
     attested_by text NOT NULL,
     attested_at timestamptz NOT NULL,
     accepted_at timestamptz,
     revoked_at timestamptz
   )`,
  `DO $$ BEGIN
     ALTER TABLE invitations ADD CONSTRAINT invitations_farm_id_farms_id_fk
       FOREIGN KEY (farm_id) REFERENCES farms (id);
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS invitations_email_idx ON invitations (email)`,
  `CREATE INDEX IF NOT EXISTS invitations_farm_idx ON invitations (farm_id)`,

  // API keys and their rate windows (ticket 36).
  `CREATE TABLE IF NOT EXISTS api_keys (
     id text PRIMARY KEY,
     name text NOT NULL,
     prefix text NOT NULL,
     key_hash text NOT NULL,
     created_by text NOT NULL,
     created_at timestamptz NOT NULL,
     last_used_at timestamptz,
     revoked_at timestamptz
   )`,
  `DO $$ BEGIN
     ALTER TABLE api_keys ADD CONSTRAINT api_keys_key_hash_unique UNIQUE (key_hash);
   EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS api_rate_windows (
     key_id text NOT NULL,
     window_start timestamptz NOT NULL,
     count integer NOT NULL,
     PRIMARY KEY (key_id, window_start)
   )`,
]

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set — run through `dotenv -e .env.local --`.')
  const sql = neon(url)

  for (const statement of STATEMENTS) {
    await sql.query(statement)
    console.log(`✓ ${statement.split('\n')[0].slice(0, 90)}`)
  }

  const farms = await sql.query('SELECT id, slug FROM farms ORDER BY created_at')
  console.log(`\n${farms.length} farm(s):`)
  for (const farm of farms) console.log(`  ${farm.id} → /f/${farm.slug}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
