import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BulkAvailabilityResponse, FarmAvailability, Item } from './contract'
import { EXAMPLE_BULK_RESPONSE } from './example'
import { buildOpenApiDocument, renderOpenApiDocument } from './openapi'

describe('the OpenAPI document', () => {
  it('matches the committed public/openapi.json — run `pnpm api:spec` if this fails', () => {
    const committed = readFileSync(join(process.cwd(), 'public', 'openapi.json'), 'utf8')
    expect(committed).toBe(renderOpenApiDocument())
  })

  it('is OpenAPI 3.1 with both endpoints behind the API key', () => {
    const doc = buildOpenApiDocument()
    expect(doc.openapi).toBe('3.1.0')
    expect(Object.keys(doc.paths)).toEqual([
      '/farms/availability',
      '/farms/{farm_id}/availability',
    ])
    expect(doc.security).toEqual([{ apiKey: [] }])
  })

  it('resolves every $ref it uses', () => {
    const doc = buildOpenApiDocument()
    const refs = JSON.stringify(doc).match(/"\$ref":"#\/components\/[^"]+"/g) ?? []
    for (const raw of new Set(refs)) {
      const path = raw.slice(raw.indexOf('#/') + 2, -1).split('/')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const target = path.reduce<any>((node, key) => node?.[key], doc)
      expect(target, raw).toBeDefined()
    }
  })

  it('carries per-item fields the brief asks for, quantities and prices included', () => {
    const doc = buildOpenApiDocument()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = (doc.components.schemas as any).Item
    expect(Object.keys(item.properties)).toEqual([
      'product',
      'variety',
      'status',
      'last_updated',
      'expected_from',
      'available_until',
      'quantity',
      'unit',
      'price',
    ])
    expect(item.additionalProperties).toBe(false)
  })
})

describe('the worked example', () => {
  it('is a response the API would actually send', () => {
    expect(() => BulkAvailabilityResponse.parse(EXAMPLE_BULK_RESPONSE)).not.toThrow()
  })

  it('shows every status', () => {
    const statuses = new Set(EXAMPLE_BULK_RESPONSE.farms.flatMap((f) => f.items.map((i) => i.status)))
    expect([...statuses].sort()).toEqual(['coming_soon', 'gone', 'in_season'])
  })
})

describe('public data only', () => {
  const item = EXAMPLE_BULK_RESPONSE.farms[0].items[0]
  const farm = EXAMPLE_BULK_RESPONSE.farms[0]

  it('refuses an item carrying anything the contract does not name', () => {
    expect(() => Item.parse({ ...item, raw_phrase: 'about 40 pounds of collards' })).toThrow()
    expect(() => Item.parse({ ...item, posted_by: 'user_abc' })).toThrow()
  })

  it('refuses a farm carrying anything the contract does not name', () => {
    expect(() => FarmAvailability.parse({ ...farm, email: 'farmer@example.com' })).toThrow()
    expect(() => FarmAvailability.parse({ ...farm, phone: '555-0100' })).toThrow()
  })
})
