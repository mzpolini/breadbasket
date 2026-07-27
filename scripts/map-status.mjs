#!/usr/bin/env node
// Prints the wayfinder map's current state by reading the ticket files.
// Derived, never hand-maintained — it cannot drift from the tickets themselves.

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = '.scratch/breadbasket-v01'
const ISSUES = join(ROOT, 'issues')

const field = (text, name) => text.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1].trim() ?? ''

const tickets = readdirSync(ISSUES)
  .filter((f) => f.endsWith('.md'))
  .sort()
  .map((file) => {
    const text = readFileSync(join(ISSUES, file), 'utf8')
    const blockedBy = field(text, 'Blocked by')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && s !== '—')
    return {
      id: file.slice(0, 2),
      title: text.match(/^#\s+(.+)$/m)?.[1] ?? file,
      status: field(text, 'Status'),
      type: field(text, 'Type'),
      audience: field(text, 'Audience'),
      blockedBy,
    }
  })

const done = (t) => t.status.startsWith('resolved') || t.status.startsWith('closed')
const byId = new Map(tickets.map((t) => [t.id, t]))
const openBlockers = (t) => t.blockedBy.filter((id) => byId.get(id) && !done(byId.get(id)))

const resolved = tickets.filter((t) => t.status.startsWith('resolved'))
const closed = tickets.filter((t) => t.status.startsWith('closed'))
const open = tickets.filter((t) => !done(t))
const blocked = open.filter((t) => openBlockers(t).length > 0)
const frontier = open.filter((t) => openBlockers(t).length === 0)

const TYPE = { grilling: 'talk', prototype: 'make', research: 'read', task: 'do  ' }
const line = (t) => {
  const who = t.audience === 'founder' ? ' ← FOUNDER' : ''
  const wait = openBlockers(t).length
    ? ` (waits on ${openBlockers(t).map((id) => byId.get(id).title).join(', ')})`
    : ''
  const claimed = t.status === 'claimed' ? ' [in progress]' : ''
  return `  ${TYPE[t.type] ?? '?   '}  ${t.title}${who}${claimed}${wait}`
}

const pct = Math.round((resolved.length / (resolved.length + open.length)) * 100)
const bar = '█'.repeat(Math.round(pct / 5)).padEnd(20, '░')

console.log(`
BreadBasket v0.1 — destination: a buildable spec

  ${bar}  ${pct}%   ${resolved.length} decided · ${open.length} to go · ${closed.length} ruled out

TAKEABLE NOW (${frontier.length})
${frontier.map(line).join('\n') || '  —'}
${blocked.length ? `\nWAITING (${blocked.length})\n${blocked.map(line).join('\n')}` : ''}
DECIDED (${resolved.length})
${resolved.map((t) => `  ${t.title}`).join('\n')}

RULED OUT (${closed.length})
${closed.map((t) => `  ${t.title}`).join('\n')}

  ${frontier.filter((t) => t.audience === 'founder').length} of the takeable tickets need the founder.
  Full detail: ${ROOT}/map.md
`)
