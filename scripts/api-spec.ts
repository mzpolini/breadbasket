/**
 * Writes `public/openapi.json` from the API contract (`lib/api/contract.ts`).
 *
 * Run `pnpm api:spec` after changing the contract and commit the result; a test
 * fails if the committed file differs from what this would write. Served at
 * `/openapi.json`, and the file to send the directory team.
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderOpenApiDocument } from '../lib/api/openapi'

const path = join(process.cwd(), 'public', 'openapi.json')
writeFileSync(path, renderOpenApiDocument())
console.log(`✓ wrote ${path}`)
