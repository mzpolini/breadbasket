'use client'

import { useState } from 'react'
import type { ProposedMovement } from '@/lib/agent/tools'

/**
 * The correction sheet.
 *
 * **Kind comes first, and the copy says why.** Everything else on this sheet is
 * a convenience; flipping total to added is the one correction that prevents
 * data loss rather than fixing a typo. If the agent read "picked 50 pounds" as
 * a total, it has just discarded everything he had, and this is the only place
 * he can catch it — so the sheet leads with the assumption it made and what
 * that assumption costs if wrong.
 */

const KINDS: { value: ProposedMovement['kind']; label: string; hint: string }[] = [
  { value: 'trueup', label: 'That’s my total', hint: 'what I have altogether' },
  { value: 'add', label: 'That came in on top', hint: 'new stock, added to what was there' },
  { value: 'remove', label: 'I sold that', hint: 'went out — market, order, gave it away' },
  { value: 'spoil', label: 'I lost that', hint: 'rot, weather, spoilage' },
]

export function EditSheet({
  movement,
  onSave,
  onClose,
}: {
  movement: ProposedMovement
  onSave: (next: ProposedMovement) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(movement)
  const [editingNumber, setEditingNumber] = useState(false)

  const changed =
    draft.kind !== movement.kind ||
    draft.amountValue !== movement.amountValue ||
    draft.measured !== movement.measured ||
    draft.product !== movement.product

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'color-mix(in srgb, var(--color-neutral-900) 50%, transparent)' }}
      onClick={onClose}
    >
      {/* Rises from the bottom of the phone frame, and never taller than it. */}
      <div
        className="max-h-[88dvh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] p-6"
        style={{ background: 'var(--color-bg)', boxShadow: 'var(--shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          value={draft.product}
          onChange={(e) => setDraft({ ...draft, product: e.target.value })}
          aria-label="crop"
          className="w-full rounded-[16px] px-3 py-2 text-[22px] capitalize"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-divider)' }}
        />
        <p
          className="meta mt-2 text-[12.5px]"
          style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}
        >
          you said &ldquo;{movement.rawPhrase}&rdquo;
        </p>
        {draft.product.trim().toLowerCase() !== movement.heardAs.trim().toLowerCase() && (
          <p
            className="mt-2 text-[13px] leading-[1.5]"
            style={{ color: 'var(--color-accent-2-700)' }}
          >
            I&rsquo;ll remember that &ldquo;{movement.heardAs}&rdquo; means{' '}
            {draft.product.trim() || '…'} on your farm.
          </p>
        )}

        {movement.kind === 'trueup' && (
          <p
            className="mt-4 text-[14px] leading-[1.55]"
            style={{ color: 'color-mix(in srgb, var(--color-text) 75%, transparent)' }}
          >
            I took that as your <strong>total</strong>. That&rsquo;s the guess most worth
            checking &mdash; if it was new stock on top of what you had, I&rsquo;ve just
            thrown the rest away.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {KINDS.map((kind) => {
            const selected = draft.kind === kind.value
            return (
              <button
                key={kind.value}
                type="button"
                onClick={() => setDraft({ ...draft, kind: kind.value })}
                className="flex flex-col items-start rounded-[18px] px-4 py-3 text-left"
                style={{
                  background: selected ? 'var(--color-accent-200)' : 'var(--color-surface)',
                  border: `1px solid ${selected ? 'var(--color-accent)' : 'transparent'}`,
                }}
              >
                <span className="text-[16px]">{kind.label}</span>
                <span
                  className="meta text-[12px]"
                  style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}
                >
                  {kind.hint}
                </span>
              </button>
            )
          })}
        </div>

        {editingNumber ? (
          <div className="mt-5 flex flex-col gap-3">
            <label className="flex items-center gap-3">
              <input
                type="number"
                step="any"
                value={draft.amountValue ?? ''}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    amountValue: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                className="w-32 rounded-full px-4 py-3 text-[17px]"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-divider)',
                }}
              />
              <span className="text-[16px]">{draft.amountUnit ?? 'no unit'}</span>
            </label>
            <label className="flex items-center gap-3 text-[15px]">
              <input
                type="checkbox"
                checked={draft.measured}
                onChange={(e) => setDraft({ ...draft, measured: e.target.checked })}
              />
              I weighed or counted it
            </label>
            <p
              className="meta text-[12px]"
              style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}
            >
              Leave that unticked if it&rsquo;s a good guess &mdash; the page says so, and
              nudges you to weigh it when the guesses stack up.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingNumber(true)}
            className="btn btn-ghost mt-4"
          >
            Change the number instead
          </button>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!changed}
            onClick={() => onSave(draft)}
          >
            That&rsquo;s right
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Leave it
          </button>
        </div>
      </div>
    </div>
  )
}
