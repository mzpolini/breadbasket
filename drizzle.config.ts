import { defineConfig } from 'drizzle-kit'

/**
 * drizzle-kit does not read .env.local — only Next does. Run migrations through
 * dotenv-cli: `pnpm db:push`.
 */
export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Unpooled: schema changes should not go through the pooler.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!,
  },
})
