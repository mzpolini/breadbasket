import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Chat } from '@/app/_components/chat'
import { SEED_FARM_SECRET } from '@/lib/seed'

/**
 * Surface 1 — the conversation. The product actually happens here; everything
 * else is downstream of what he says.
 *
 * Identity is the settled v0.1 model: one farm behind one secret URL, no login
 * and nothing to remember.
 *
 * `?v=1` turns on the machinery view — the same surface at higher verbosity
 * rather than a separate admin panel, so what he sees is what actually happened.
 */
export default async function FarmerChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ secret: string }>
  searchParams: Promise<{ v?: string }>
}) {
  const { secret } = await params
  if (secret !== SEED_FARM_SECRET) notFound()

  const verbose = (await searchParams).v === '1'

  return (
    <main className="mx-auto w-full max-w-[560px]">
      <div
        className="flex items-baseline gap-3 px-4 pt-4 text-[13px]"
        style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}
      >
        <span className="meta">BreadBasket</span>
        <Link href={`/farm/${secret}/stock`} className="ml-auto underline">
          what you&rsquo;ve got
        </Link>
        <Link href={`/farm/${secret}?v=${verbose ? '0' : '1'}`} className="underline">
          {verbose ? 'less' : 'show your working'}
        </Link>
      </div>

      <Chat verbose={verbose} />
    </main>
  )
}
