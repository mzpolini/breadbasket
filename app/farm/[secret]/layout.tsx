import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { FarmNav } from '@/app/_components/farm-nav'
import { SEED_FARM_SECRET } from '@/lib/seed'

/**
 * The farmer's shell.
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
    <div className="flex min-h-dvh flex-col">
      <Suspense fallback={<div className="h-[52px]" style={{ background: 'var(--color-neutral-900)' }} />}>
        <FarmNav secret={secret} />
      </Suspense>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}
