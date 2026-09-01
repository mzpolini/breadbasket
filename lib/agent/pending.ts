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
 * The most recent read-back still waiting on him, or `null`.
 *
 * Scans forward and keeps the last match, so a correction supersedes the card
 * it corrected. Reads `drafts` so an edit made in the sheet is what publishes.
 */
export function latestPending(
  messages: FarmUIMessage[],
  committed: Set<string>,
  drafts: Record<string, ProposedMovement[]>,
): Pending | null {
  let found: Pending | null = null

  for (const message of messages) {
    for (const part of message.parts) {
      const proposalId = (part as { toolCallId?: string }).toolCallId
      if (!proposalId || committed.has(proposalId)) continue

      if (part.type === 'tool-proposeMovements' && 'output' in part && part.output) {
        const output = part.output as { movements: ProposedMovement[] }
        found = { kind: 'movements', proposalId, movements: drafts[proposalId] ?? output.movements }
      }

      if (part.type === 'tool-proposeHarvestRules' && 'output' in part && part.output) {
        const output = part.output as { rules: ProposedRule[] }
        found = { kind: 'rules', proposalId, rules: output.rules }
      }
    }
  }

  return found
}
