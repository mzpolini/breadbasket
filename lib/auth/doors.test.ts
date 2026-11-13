import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Every door asks who is there.
 *
 * The behavioural tests in `roles.test.ts` prove the doors that exist today. This
 * one is for the door added next week: it reads the source and fails for any
 * Server Action, route handler or protected page that doesn't check for itself.
 * The proxy doesn't cover Server Actions, and a layout doesn't re-render between
 * its pages — so "it's under /admin" is not a check.
 *
 * Blunt on purpose (a substring in the right function), because the failure it
 * guards against is forgetting, not cleverness.
 */

const APP = join(process.cwd(), 'app')

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? files(path) : [path]
  })
}

const all = files(APP)
const rel = (path: string) => path.slice(process.cwd().length + 1)
const read = (path: string) => readFileSync(path, 'utf8')

const CHECKS = /\b(requireFarmAccess|requireAdmin|checkFarmAccess)\(/
// The directory's API authenticates a key instead of a session (ticket 36).
const API_KEY_CHECK = /\b(?:authenticateApiKey|apiRoute)\(/

describe('Server Actions', () => {
  const modules = all.filter((f) => /\.tsx?$/.test(f) && /^['"]use server['"]/m.test(read(f)))

  it('are found', () => expect(modules.length).toBeGreaterThan(0))

  for (const file of modules) {
    // Split into one chunk per exported function.
    const chunks = read(file).split(/^export (?:async )?function /m).slice(1)
    for (const chunk of chunks) {
      const name = chunk.slice(0, chunk.indexOf('('))
      it(`${rel(file)} → ${name} checks who is calling`, () => {
        // The check must come before anything else is done — i.e. in the body.
        expect(chunk.slice(chunk.indexOf('{'))).toMatch(CHECKS)
      })
    }
  }
})

describe('route handlers', () => {
  const routes = all.filter((f) => /\/route\.ts$/.test(f))

  for (const file of routes) {
    it(`${rel(file)} checks who is calling`, () => {
      const source = read(file)
      const underV1 = rel(file).startsWith('app/api/v1/')
      expect(source).toMatch(underV1 ? new RegExp(`${CHECKS.source}|${API_KEY_CHECK.source}`) : CHECKS)
    })
  }
})

describe('protected pages', () => {
  // A layout's check protects the first load; a page is what gets re-entered.
  const pages = all.filter(
    (f) => /\/page\.tsx$/.test(f) && (rel(f).startsWith('app/farm/') || rel(f).startsWith('app/admin/')),
  )

  it('are found', () => expect(pages.length).toBeGreaterThan(0))

  for (const file of pages) {
    it(`${rel(file)} checks who is looking`, () => {
      expect(read(file)).toMatch(CHECKS)
    })
  }
})
