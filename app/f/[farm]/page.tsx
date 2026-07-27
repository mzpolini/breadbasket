import { notFound } from 'next/navigation'
import { AvailabilityCard } from '@/app/_components/availability-card'
import { SEED_FARM_ID } from '@/lib/seed'

/**
 * Surface 3 for **buyers** — the URL the farmer hands out.
 *
 * No nav, no tabs, nothing about the app: a buyer arriving here wants to know
 * what he has, and every farmer-facing control would be noise or a way to get
 * lost. The farmer's own view of this same card lives inside his shell, at
 * `/farm/<secret>/preview`, so he never lands on a page with no way back.
 */
export default async function FarmAvailabilityPage({
  params,
}: {
  params: Promise<{ farm: string }>
}) {
  const { farm } = await params
  if (farm !== SEED_FARM_ID) notFound()

  return (
    <main className="mx-auto w-full max-w-[352px] px-1 py-10">
      <AvailabilityCard />
    </main>
  )
}
