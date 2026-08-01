import { Suspense } from 'react'
import { FarmNav } from '@/app/_components/farm-nav'
import { requireFarmAccess } from '@/lib/auth/current-user'

/**
 * The farmer's shell — one phone-shaped frame that every surface lives inside.
 *
 * The frame owns the height and the overflow, which is what fixes the "page
 * islands" problem: the header is painted once here and never remounts on
 * navigation, and each page scrolls *within* the frame rather than scrolling the
 * document out from under it.
 *
 * Farm access is checked here via Clerk + role verification, so identity is
 * verified once at the boundary rather than in each page.
 *
 * FarmNav reads search params, which means Suspense: without it the whole shell
 * would opt into dynamic rendering and the nav would block first paint.
 */
export default async function FarmLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ farmId: string }>
}) {
  const { farmId } = await params

  // Verify access — requireFarmAccess redirects/notFound as needed
  await requireFarmAccess(farmId)

  return (
    <div className="phone">
      <Suspense fallback={<div className="h-[102px] flex-none" />}>
        <FarmNav farmId={farmId} />
      </Suspense>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
