import { Chat } from '@/app/_components/chat'
import { messagesForFarm } from '@/lib/storage/messages'
import { publishedRuleProposals } from '@/lib/storage/harvest-rules'
import { publishedProposals } from '@/lib/storage/movements'
import { publishedIds } from '@/lib/storage/proposals'

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
  params,
  searchParams,
}: {
  params: Promise<{ farmId: string }>
  searchParams: Promise<{ v?: string }>
}) {
  const { farmId } = await params
  const verbose = (await searchParams).v === '1'

  const [messages, publishedMovements, publishedRules, recorded] = await Promise.all([
    messagesForFarm(farmId),
    publishedProposals(farmId),
    publishedRuleProposals(farmId),
    publishedIds(farmId),
  ])
  // The publish record is the truth going forward; the other two cover
  // read-backs published before it existed, so a reload can't offer them again.
  const published = [...new Set([...publishedMovements, ...publishedRules, ...recorded])]

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <Chat verbose={verbose} initialMessages={messages} publishedProposals={published} farmId={farmId} />
    </main>
  )
}
