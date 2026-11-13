import type { BulkAvailabilityResponse } from './contract'

/**
 * A full bulk response, one farm per kind of state, for the OpenAPI document.
 *
 * Consumers map from examples faster than from schemas, so this is written to
 * show every status and every nullable field in both of its forms. It is parsed
 * against the contract in a test, so it can't drift into describing a response
 * the API would refuse to send.
 */
export const EXAMPLE_BULK_RESPONSE: BulkAvailabilityResponse = {
  generated_at: '2026-11-19T14:05:00Z',
  farms: [
    {
      farm_id: 'farm_k3x9q2m7v1ta',
      directory_profile_id: 'mabfc-0142',
      farm_stand_url: 'https://breadbasket.example/f/greenacre',
      last_updated: '2026-11-18T16:22:10Z',
      items: [
        {
          product: 'collard greens',
          variety: null,
          status: 'in_season',
          last_updated: '2026-11-18T16:22:10Z',
          expected_from: null,
          available_until: null,
          quantity: null,
          unit: null,
          price: null,
        },
        {
          product: 'sweet potatoes',
          variety: 'beauregard',
          status: 'in_season',
          last_updated: '2026-11-17T09:41:00Z',
          expected_from: null,
          available_until: '2026-12-20',
          quantity: null,
          unit: null,
          price: null,
        },
      ],
    },
    {
      farm_id: 'farm_7hd02pq8zc4n',
      directory_profile_id: 'mabfc-0377',
      farm_stand_url: 'https://breadbasket.example/f/sweetwater-acres',
      last_updated: '2026-11-16T12:00:00Z',
      items: [
        {
          product: 'okra',
          variety: null,
          status: 'gone',
          last_updated: '2026-11-16T12:00:00Z',
          expected_from: null,
          available_until: null,
          quantity: null,
          unit: null,
          price: null,
        },
        {
          product: 'turnips',
          variety: null,
          status: 'coming_soon',
          last_updated: '2026-11-16T12:00:00Z',
          expected_from: '2026-11-30',
          available_until: null,
          quantity: null,
          unit: null,
          price: null,
        },
      ],
    },
    {
      farm_id: 'farm_q1w8e5r2t9yu',
      directory_profile_id: 'mabfc-0519',
      farm_stand_url: 'https://breadbasket.example/f/three-sisters',
      last_updated: null,
      items: [],
    },
  ],
}
