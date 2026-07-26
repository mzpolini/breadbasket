import { Chat } from '@/app/_components/chat'

/**
 * Surface 1 — the conversation. The product happens here; everything else is
 * downstream of what he says.
 *
 * The secret is checked in the layout, and the nav lives there too, so this file
 * is only the conversation.
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

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col">
      <Chat verbose={verbose} />
    </main>
  )
}
