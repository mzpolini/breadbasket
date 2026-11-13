import { notFound } from 'next/navigation'
import { AvailabilityCard } from '@/app/_components/availability-card'
import { getFarmBySlug } from '@/lib/storage/farms'

/**
 * Surface 3 for **buyers** — the URL the farmer hands out.
 *
 * No nav, no tabs, nothing about the app: a buyer arriving here wants to know
 * what he has, and every farmer-facing control would be noise or a way to get
 * lost. The farmer's own view of this same card lives inside his shell, at
 * `/farm/<id>/preview`, so he never lands on a page with no way back.
 *
 * The segment is the farm's **slug**, not its ID. Only a KYF-verified farm has a
 * stand: an unverified farm answers exactly as a farm that doesn't exist, so the
 * public can't tell the two apart. Its farmer still sees the page in preview.
 */
export default async function FarmAvailabilityPage({
  params,
}: {
  params: Promise<{ farm: string }>
}) {
  const { farm: slug } = await params
  const farm = await getFarmBySlug(slug)
  if (!farm || !farm.kyfVerified) notFound()

  return (
    <main className="mx-auto w-full max-w-[352px] px-1 py-10">
      <AvailabilityCard farm={farm} />
    </main>
  )
}
