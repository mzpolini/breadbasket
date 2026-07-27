import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { FarmNav } from '@/app/_components/farm-nav'
import { SEED_FARM_SECRET } from '@/lib/seed'

/**
 * The farmer's shell — one phone-shaped frame that every surface lives inside.
 *
 * The frame owns the height and the overflow, which is what fixes the "page
 * islands" problem: the header is painted once here and never remounts on
 * navigation, and each page scrolls *within* the frame rather than scrolling the
 * document out from under it.
 *
 * The secret is checked once here rather than in each page — it is the whole of
 * v0.1 identity, so it belongs at the boundary rather than repeated behind it.
 *
 * FarmNav reads search params, which means Suspense: without it the whole shell
 * would opt into dynamic rendering and the nav would block first paint.
 */
export default async function FarmLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ secret: string }>
}) {
  const { secret } = await params
  if (secret !== SEED_FARM_SECRET) notFound()

  return (
    <div className="phone">
      <Suspense fallback={<div className="h-[102px] flex-none" />}>
        <FarmNav secret={secret} />
      </Suspense>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
