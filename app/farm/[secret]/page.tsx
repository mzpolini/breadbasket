import { Chat } from '@/app/_components/chat'
import { SEED_FARM_ID } from '@/lib/seed'
import { messagesForFarm } from '@/lib/storage/messages'
import { publishedProposals } from '@/lib/storage/movements'

/**
 * Surface 1 — the conversation. The product happens here; everything else is
 * downstream of what he says.
 *
 * The transcript is loaded server-side so he lands back in the conversation he
 * left, read-back cards and all — and alongside it, which of those cards already
 * reached the ledger, so a published card cannot come back offering to publish
 * itself again.
 *
 * `?v=1` turns on the machinery: the same surface at higher verbosity rather
 * than a separate admin panel, so what he sees is what actually happened.
 */
export default async function FarmerChatPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>
}) {
  const verbose = (await searchParams).v === '1'

  const [messages, published] = await Promise.all([
    messagesForFarm(SEED_FARM_ID),
    publishedProposals(SEED_FARM_ID),
  ])

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <Chat verbose={verbose} initialMessages={messages} publishedProposals={published} />
    </main>
  )
}
