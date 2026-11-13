/**
 * The farm's identity, as other systems see it.
 *
 * Two names, two jobs. The **farm ID** is what the MABFC directory joins on, so
 * it is generated once and never changes. The **slug** is what a customer types,
 * so it is readable and can be edited. Keeping them apart means renaming a
 * farm's page never orphans a pin on the directory map.
 *
 * Pure, so the rules are testable without a database.
 */

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const ID_LENGTH = 12

/**
 * `farm_` plus twelve lowercase base-36 characters — about 62 bits, plenty for
 * a co-op's worth of farms. Lowercase so it survives being pasted into a URL or
 * a spreadsheet. Uses rejection sampling so every character is equally likely.
 */
export function newFarmId(randomBytes: (n: number) => Uint8Array = defaultRandomBytes): string {
  let out = ''
  while (out.length < ID_LENGTH) {
    for (const byte of randomBytes(ID_LENGTH * 2)) {
      // 252 is the largest multiple of 36 below 256; anything above it is biased.
      if (byte >= 252) continue
      out += ID_ALPHABET[byte % ID_ALPHABET.length]
      if (out.length === ID_LENGTH) break
    }
  }
  return `farm_${out}`
}

function defaultRandomBytes(n: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(n))
}

/** Lowercase letters, digits and single hyphens, 2–64 characters, no hyphen at either end. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * What an admin typed, made into a URL segment: "Greenacre Farm!" → "greenacre-farm".
 * Returns null when nothing usable is left.
 */
export function toSlug(input: string): string | null {
  const slug = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/, '')
  return isValidSlug(slug) ? slug : null
}

export function isValidSlug(slug: string): boolean {
  return slug.length >= 2 && slug.length <= 64 && SLUG_PATTERN.test(slug)
}

/**
 * The public farm stand URL. `PUBLIC_BASE_URL` is set per environment so
 * staging links point at staging; absent, the URL is relative.
 */
export function farmStandUrl(
  farm: { slug: string },
  baseUrl: string | undefined = process.env.PUBLIC_BASE_URL,
): string {
  const base = (baseUrl ?? '').replace(/\/+$/, '')
  return `${base}/f/${farm.slug}`
}

/**
 * Whether a farm is in the read API: KYF-verified **and** mapped to a directory
 * profile. The same rule `mappedFarms` puts in its query, kept here so it can be
 * tested — and applied again to what the query returns, so a loosened `WHERE`
 * can't quietly publish a farm that isn't supposed to be public.
 */
export function isMapped<T extends { kyfVerified: boolean; directoryProfileId: string | null }>(
  farm: T,
): farm is T & { directoryProfileId: string } {
  return farm.kyfVerified && farm.directoryProfileId !== null && farm.directoryProfileId !== ''
}
