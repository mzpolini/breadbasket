import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AvailabilityCard } from '@/app/_components/availability-card'
import { requireFarmAccess } from '@/lib/auth/current-user'
import { farmStandUrl } from '@/lib/farms'
import { getFarm } from '@/lib/storage/farms'

/**
 * The farmer looking at his own public page, **inside his shell** — same card a
 * buyer sees, with his nav still above it.
 *
 * This route exists because the previous "Your page" tab sent him out to
 * `/f/<farm>`, which by design has no nav, so he arrived somewhere with no way
 * back. A preview keeps the buyer page pristine and keeps him oriented.
 *
 * It renders whether or not the farm is KYF-verified, so he can see his page
 * before it goes public — with a note saying it isn't yet. The buyer URL
 * answers 404 until it is.
 *
 * The line at the bottom is the one thing a buyer doesn't get: what to do if the
 * page is wrong. The answer is always "go and say so", never "edit this page" —
 * the conversation is the only way in.
 */
export default async function PagePreview({
  params,
}: {
  params: Promise<{ farmId: string }>
}) {
  const { farmId } = await params
  await requireFarmAccess(farmId)
  const farm = await getFarm(farmId)
  if (!farm) notFound()

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-8 pt-[18px]">
      <p
        className="meta mb-4 text-[11.5px] leading-[1.5]"
        style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}
      >
        {farm.kyfVerified
          ? `This is what buyers see at ${farmStandUrl(farm)}`
          : 'This is what buyers will see.'}
      </p>

      {!farm.kyfVerified && (
        <p
          role="status"
          className="mb-4 rounded-[14px] px-[14px] py-[10px] text-[13.5px] leading-[1.5]"
          style={{
            background: 'var(--color-accent-2-200)',
            color: 'var(--color-accent-2-800)',
          }}
        >
          Not public yet. Nobody can open this page until your farm is verified &mdash;
          you can still see it here, and it fills in as you talk.
        </p>
      )}

      <AvailabilityCard farm={farm} />

      <div className="mt-6 flex flex-col items-start gap-3">
        <span
          className="text-[14px] leading-[1.55]"
          style={{ color: 'color-mix(in srgb, var(--color-text) 70%, transparent)' }}
        >
          Wrong? There&rsquo;s nothing to edit here &mdash; tell it what changed and this
          page follows.
        </span>
        <Link href={`/farm/${farmId}`} className="btn btn-primary">
          Talk about what changed
        </Link>
      </div>
    </main>
  )
}
