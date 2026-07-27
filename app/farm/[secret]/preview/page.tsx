import Link from 'next/link'
import { AvailabilityCard } from '@/app/_components/availability-card'
import { SEED_FARM_ID } from '@/lib/seed'

/**
 * The farmer looking at his own public page, **inside his shell** — same card a
 * buyer sees, with his nav still above it.
 *
 * This route exists because the previous "Your page" tab sent him out to
 * `/f/<farm>`, which by design has no nav, so he arrived somewhere with no way
 * back. A preview keeps the buyer page pristine and keeps him oriented.
 *
 * The line at the bottom is the one thing a buyer doesn't get: what to do if the
 * page is wrong. The answer is always "go and say so", never "edit this page" —
 * the conversation is the only way in.
 */
export default async function PagePreview({
  params,
}: {
  params: Promise<{ secret: string }>
}) {
  const { secret } = await params

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-8 pt-[18px]">
      <p
        className="meta mb-4 text-[11.5px] leading-[1.5]"
        style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}
      >
        This is what buyers see at /f/{SEED_FARM_ID}
      </p>

      <AvailabilityCard />

      <div className="mt-6 flex flex-col items-start gap-3">
        <span
          className="text-[14px] leading-[1.55]"
          style={{ color: 'color-mix(in srgb, var(--color-text) 70%, transparent)' }}
        >
          Wrong? There&rsquo;s nothing to edit here &mdash; tell it what changed and this
          page follows.
        </span>
        <Link href={`/farm/${secret}`} className="btn btn-primary">
          Talk about what changed
        </Link>
      </div>
    </main>
  )
}
