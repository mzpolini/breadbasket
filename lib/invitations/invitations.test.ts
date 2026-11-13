import { describe, expect, it } from 'vitest'
import { invitationState, invitationToAccept, isValidEmail, normaliseEmail } from './index'

const at = (day: number) => new Date(`2026-11-${String(day).padStart(2, '0')}T12:00:00Z`)
const invite = (over: Partial<Parameters<typeof invitationToAccept>[0][number]> = {}) => ({
  email: 'alice@farm.test',
  invitedAt: at(13),
  acceptedAt: null,
  revokedAt: null,
  ...over,
})

describe('invitationState', () => {
  it('is open until it is accepted or revoked', () => {
    expect(invitationState(invite())).toBe('open')
    expect(invitationState(invite({ revokedAt: at(14) }))).toBe('revoked')
    expect(invitationState(invite({ acceptedAt: at(14) }))).toBe('accepted')
  })

  it('says accepted, not revoked, for someone who got in before the revoke', () => {
    expect(invitationState(invite({ acceptedAt: at(14), revokedAt: at(15) }))).toBe('accepted')
  })
})

describe('invitationToAccept', () => {
  it('matches the email however it was typed', () => {
    const found = invitationToAccept([invite({ email: 'alice@farm.test' })], '  Alice@Farm.TEST ')
    expect(found).not.toBeNull()
  })

  it('finds nothing for someone nobody invited', () => {
    expect(invitationToAccept([invite()], 'mallory@farm.test')).toBeNull()
  })

  it('ignores invitations that are spent or withdrawn', () => {
    const spent = [invite({ acceptedAt: at(14) }), invite({ revokedAt: at(14) })]
    expect(invitationToAccept(spent, 'alice@farm.test')).toBeNull()
  })

  it('takes the newest open one when a person was invited twice', () => {
    const older = invite({ invitedAt: at(12) })
    const newer = invite({ invitedAt: at(14) })
    expect(invitationToAccept([older, newer], 'alice@farm.test')).toBe(newer)
  })
})

describe('email handling', () => {
  it('stores lowercase and trimmed', () => {
    expect(normaliseEmail('  Alice@Farm.Test ')).toBe('alice@farm.test')
  })

  it('rejects what is plainly not an address', () => {
    expect(isValidEmail('alice@farm.test')).toBe(true)
    for (const bad of ['', 'alice', 'alice@', '@farm.test', 'alice@farm', 'a b@farm.test']) {
      expect(isValidEmail(bad)).toBe(false)
    }
  })
})
