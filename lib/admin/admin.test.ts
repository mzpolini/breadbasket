import { describe, expect, it } from 'vitest'
import {
  buildPeople,
  fillDays,
  summarisePeople,
  timeAgo,
  type ClerkAccount,
  type InvitationRowFacts,
  type UserFacts,
} from '.'

const now = new Date('2026-11-15T17:00:00Z')
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000)

const account = (id: string, email: string, over: Partial<ClerkAccount> = {}): ClerkAccount => ({
  id,
  email,
  name: null,
  createdAt: hoursAgo(500),
  lastSignInAt: null,
  lastActiveAt: null,
  ...over,
})
const user = (id: string, over: Partial<UserFacts> = {}): UserFacts => ({
  id,
  role: 'farmer',
  farmId: 'farm_a',
  email: null,
  createdAt: hoursAgo(400),
  ...over,
})
const invite = (id: string, email: string, over: Partial<InvitationRowFacts> = {}): InvitationRowFacts => ({
  id,
  email,
  farmId: 'farm_a',
  role: 'farmer',
  invitedBy: 'user_admin',
  invitedAt: hoursAgo(600),
  acceptedAt: null,
  revokedAt: null,
  ...over,
})

describe('buildPeople', () => {
  const people = buildPeople({
    accounts: [
      account('user_admin', 'admin@x.org', { lastSignInAt: hoursAgo(1), lastActiveAt: hoursAgo(1) }),
      account('user_farmer', 'Farmer@X.org', { lastSignInAt: hoursAgo(100) }),
      account('user_walkin', 'walkin@x.org'),
      account('user_pending', 'pending@x.org', { lastSignInAt: hoursAgo(2) }),
    ],
    users: [
      user('user_admin', { role: 'admin', farmId: null }),
      user('user_farmer'),
      user('user_pending', { farmId: null }),
      user('user_gone', { email: 'gone@x.org' }),
    ],
    invitations: [
      invite('i_old', 'farmer@x.org', { invitedAt: hoursAgo(900), revokedAt: hoursAgo(800) }),
      invite('i_new', 'farmer@x.org', { acceptedAt: hoursAgo(400) }),
      invite('i_open', 'later@x.org'),
      invite('i_revoked', 'nope@x.org', { revokedAt: hoursAgo(10) }),
    ],
    posting: [{ postedBy: 'user_farmer', lastPostedAt: hoursAgo(30), messages: 12 }],
  })
  const by = (key: string) => people.find((p) => p.key === key)!

  it('gives each person a status from their user row', () => {
    expect(by('user_admin').status).toBe('admin')
    expect(by('user_farmer').status).toBe('farmer')
    expect(by('user_pending').status).toBe('pending')
    expect(by('user_walkin').status).toBe('uninvited')
  })

  it('matches the newest invitation by email, case-insensitively', () => {
    expect(by('user_farmer').invitation).toMatchObject({ id: 'i_new', state: 'accepted' })
  })

  it('lists invitations nobody has taken up as their own rows', () => {
    expect(by('i_open')).toMatchObject({ status: 'invited', clerkId: null })
    expect(by('i_revoked')).toMatchObject({ status: 'revoked' })
    expect(people.some((p) => p.key === 'i_new' || p.key === 'i_old')).toBe(false)
  })

  it('keeps a user row Clerk did not return', () => {
    expect(by('user_gone')).toMatchObject({ email: 'gone@x.org', lastSignInAt: null })
  })

  it('carries posting counts', () => {
    expect(by('user_farmer')).toMatchObject({ messages: 12, lastPostedAt: hoursAgo(30) })
  })

  it('sorts the most recently seen first', () => {
    expect(people[0].key).toBe('user_admin')
  })

  it('summarises', () => {
    const invitations = [
      invite('a', 'a@x', { acceptedAt: now }),
      invite('b', 'b@x'),
      invite('c', 'c@x', { revokedAt: now }),
    ]
    expect(summarisePeople(people, invitations, now)).toEqual({
      accounts: 5,
      signedIn: 3,
      active24h: 2,
      active7d: 3,
      posted: 1,
      waiting: 2,
      invitations: { open: 1, accepted: 1, revoked: 1 },
    })
  })

  it('still works without Clerk', () => {
    const rows = buildPeople({ accounts: null, users: [user('u1')], invitations: [], posting: [] })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ status: 'farmer', lastSignInAt: null })
  })
})

describe('fillDays', () => {
  it('returns every day ending today, with zeros for quiet ones', () => {
    const days = fillDays([{ day: '2026-11-14', messages: 3, people: 2 }], 3, now)
    expect(days).toEqual([
      { day: '2026-11-13', messages: 0, people: 0 },
      { day: '2026-11-14', messages: 3, people: 2 },
      { day: '2026-11-15', messages: 0, people: 0 },
    ])
  })

  it('counts days in Maryland, not UTC', () => {
    // 02:00 UTC on the 16th is still the evening of the 15th in New York.
    const late = new Date('2026-11-16T02:00:00Z')
    expect(fillDays([], 1, late)[0].day).toBe('2026-11-15')
  })

  it('has no duplicate or missing days across the DST change', () => {
    const days = fillDays([], 5, new Date('2026-11-03T15:00:00Z')).map((d) => d.day)
    expect(days).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03'])
  })
})

describe('timeAgo', () => {
  it('reads like a person would say it', () => {
    expect(timeAgo(null, now)).toBe('—')
    expect(timeAgo(hoursAgo(0.001), now)).toBe('just now')
    expect(timeAgo(hoursAgo(0.5), now)).toBe('30 min ago')
    expect(timeAgo(hoursAgo(5), now)).toBe('5 h ago')
    expect(timeAgo(hoursAgo(72), now)).toBe('3 d ago')
    expect(timeAgo(new Date('2026-09-01T12:00:00Z'), now)).toBe('Sep 1')
  })
})
