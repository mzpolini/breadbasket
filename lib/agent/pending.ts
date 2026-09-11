import type { ProposedMovement, ProposedRule } from './tools'
import type { FarmUIMessage } from './ui-message'

/**
 * Which read-back a spoken "yes" means.
 *
 * The agent cannot write. When he says yes it calls `publishPending`, and the
 * screen publishes what this returns through the same server action the button
 * uses — so words and tap end in the same place, and nothing he has not seen
 * read back can reach the ledger.
 *
 * Pure and tested because the failure mode is silent: pick the wrong card and
 * he publishes something he was mid-way through correcting; miss the
 * `committed` check and one "yes" writes the same batch twice.
 */
export type Pending =
  | { kind: 'movements'; proposalId: string; movements: ProposedMovement[] }
  | { kind: 'rules'; proposalId: string; rules: ProposedRule[] }

/**
 * The read-back still waiting on him, or `null`.
 *
 * **Only the newest one counts.** A read-back he corrected is dead: scanning
 * past it to an older uncommitted card is exactly how a batch he had rejected
 * reached the ledger, nine times, once the newest card had been published
 * (ADR 0003). If the newest is already up, there is nothing to publish — not
 * something else.
 *
 * Reads `drafts` so an edit made in the sheet is what publishes.
 */
export function latestPending(
  messages: FarmUIMessage[],
  committed: Set<string>,
  drafts: Record<string, ProposedMovement[]>,
): Pending | null {
  const newest = newestReadBack(messages, drafts)
  return newest && committed.has(newest.proposalId) ? null : newest
}

/**
 * The last read-back in the transcript, published or not.
 *
 * Exported so the screen can tell a live card from one he has already talked
 * past: an older card still rendering "Sounds good" is the same dead-card
 * publish as the relay's, just reachable with a thumb instead of a yes.
 */
export function newestProposalId(messages: FarmUIMessage[]): string | null {
  return newestReadBack(messages, {})?.proposalId ?? null
}

function newestReadBack(
  messages: FarmUIMessage[],
  drafts: Record<string, ProposedMovement[]>,
): Pending | null {
  let newest: Pending | null = null

  for (const message of messages) {
    for (const part of message.parts) {
      const proposalId = (part as { toolCallId?: string }).toolCallId
      if (!proposalId) continue

      if (part.type === 'tool-proposeMovements' && 'output' in part && part.output) {
        const output = part.output as { movements: ProposedMovement[] }
        newest = { kind: 'movements', proposalId, movements: drafts[proposalId] ?? output.movements }
      }

      if (part.type === 'tool-proposeHarvestRules' && 'output' in part && part.output) {
        const output = part.output as { rules: ProposedRule[] }
        newest = { kind: 'rules', proposalId, rules: output.rules }
      }
    }
  }

  return newest
}

/** A yes that may be acted on, and the card it publishes. */
export type Relay = {
  /** The `publishPending` tool call this answers, so one yes acts once. */
  signalId: string
  target: Pending
}

/**
 * Which spoken yes, if any, to act on right now.
 *
 * **Only a signal in the newest message is live.** The transcript is reloaded
 * in full on every mount, so a relay that scans all of it re-fires every yes
 * the conversation has ever contained — which is what published a corrected
 * read-back nine times, a minute after he had moved on, with nothing on screen
 * to show for it. A yes is part of the turn he is in; outside that turn it is
 * a record of something he already said.
 *
 * Pure so the rule can be tested without a browser, which is where it failed.
 */
export function publishOnSignal(
  messages: FarmUIMessage[],
  committed: Set<string>,
  drafts: Record<string, ProposedMovement[]>,
  relayed: Set<string>,
): Relay | null {
  const current = messages[messages.length - 1]
  if (!current) return null

  for (const part of current.parts) {
    if (part.type !== 'tool-publishPending') continue

    const signalId = (part as { toolCallId?: string }).toolCallId
    if (!signalId || relayed.has(signalId)) continue

    const target = latestPending(messages, committed, drafts)
    if (target) return { signalId, target }
  }

  return null
}
