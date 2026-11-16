import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { FarmNav } from '@/app/_components/farm-nav'
import { requireFarmAccess } from '@/lib/auth/current-user'
import { getFarm } from '@/lib/storage/farms'

/**
 * The farmer's shell — one phone-shaped frame that every surface lives inside.
 *
 * The frame owns the height and the overflow, which is what fixes the "page
 * islands" problem: the header is painted once here and never remounts on
 * navigation, and each page scrolls *within* the frame rather than scrolling the
 * document out from under it.
 *
 * Farm access is checked here so a refused visitor never sees the shell — but a
 * layout does not re-render when he moves between its pages, so it is not the
 * check that protects them. Each page asks for access itself.
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
  const user = await requireFarmAccess(farmId)
  const isAdmin = user.role === 'admin'

  // An admin may ask for a farm that doesn't exist; that is a 404, not a crash.
  const farm = await getFarm(farmId)
  if (!farm) notFound()

  return (
    <div className="phone">
      {isAdmin && <AdminBanner farmId={farm.id} farmName={farm.name} />}
      <Suspense fallback={<div className="h-[102px] flex-none" />}>
        <FarmNav farmId={farmId} farmName={farm.name} isAdmin={isAdmin} />
      </Suspense>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

/**
 * An admin in a farm's shell is acting *as* that farm: what they say goes into
 * its ledger and onto its public stand. The frame says so, and offers the way
 * back, so it can't be done by accident or mistaken for the admin's own view.
 */
function AdminBanner({ farmId, farmName }: { farmId: string; farmName: string }) {
  return (
    <div
      role="note"
      className="meta flex flex-none items-center justify-between gap-3 px-[18px] py-[7px] text-[11px] leading-[1.3]"
      style={{ background: 'var(--color-neutral-900)', color: 'var(--color-neutral-100)' }}
    >
      <span className="min-w-0 truncate">
        Admin · acting as {farmName} — writes are live
      </span>
      <Link href={`/admin/farms/${farmId}`} className="flex-none underline underline-offset-2">
        Back to admin
      </Link>
    </div>
  )
}
