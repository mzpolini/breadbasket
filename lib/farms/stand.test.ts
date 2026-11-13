import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FarmRow } from '../db/schema'

/**
 * The farm stand for every farm, but only for verified ones. The page is called
 * as the function it is, with the farm lookup faked.
 */

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

const farms = vi.hoisted(() => ({ bySlug: new Map<string, unknown>() }))
vi.mock('../storage/farms', () => ({
  getFarmBySlug: async (slug: string) => farms.bySlug.get(slug) ?? null,
}))

import FarmAvailabilityPage from '@/app/f/[farm]/page'

const farm = (over: Partial<FarmRow> = {}): FarmRow => ({
  id: 'farm_abc123',
  name: 'Greenacre Farm',
  slug: 'greenacre',
  directoryProfileId: null,
  kyfVerified: true,
  tagline: null,
  market: null,
  logo: null,
  createdAt: new Date(),
  ...over,
})

const render = (slug: string) => FarmAvailabilityPage({ params: Promise.resolve({ farm: slug }) })

beforeEach(() => farms.bySlug.clear())

describe('/f/[slug]', () => {
  it('renders a verified farm under its slug, with its own identity', async () => {
    farms.bySlug.set('greenacre', farm())

    const page = (await render('greenacre')) as { props: { children: { props: { farm: FarmRow } } } }

    expect(page.props.children.props.farm).toMatchObject({
      id: 'farm_abc123',
      name: 'Greenacre Farm',
    })
  })

  it('is a 404 for a farm that is not KYF-verified', async () => {
    farms.bySlug.set('greenacre', farm({ kyfVerified: false }))
    await expect(render('greenacre')).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('answers an unverified farm exactly as a farm that does not exist', async () => {
    farms.bySlug.set('greenacre', farm({ kyfVerified: false }))

    const unverified = await render('greenacre').catch((e: Error) => e.message)
    const missing = await render('no-such-farm').catch((e: Error) => e.message)

    expect(unverified).toBe(missing)
  })

  it('does not resolve a farm by its ID — only by its slug', async () => {
    farms.bySlug.set('greenacre', farm())
    await expect(render('farm_abc123')).rejects.toThrow('NEXT_NOT_FOUND')
  })
})
