'use client'

import { useState, useTransition } from 'react'
import { issueApiKey, revokeApiKey } from '@/app/admin/_actions'

export type ApiKeyView = {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsedAt: string | null
  revoked: boolean
}

/**
 * The keys that can read Breadbasket, and the two things an admin does with
 * them: issue one and revoke one. Rotating is both, in that order — there is
 * no "regenerate", so the old key keeps working until it is revoked.
 */
export function ApiKeysPanel({ keys }: { keys: ApiKeyView[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // The plaintext, held in this component's state only — it is never on the
  // server again, so leaving the page loses it by design.
  const [fresh, setFresh] = useState<{ name: string; key: string } | null>(null)
  const [copied, setCopied] = useState(false)

  return (
    <div className="space-y-6">
      {fresh && (
        <div role="status" className="adm-fresh-key space-y-2">
          <p className="text-sm font-semibold">
            Key for &ldquo;{fresh.name}&rdquo; &mdash; copy it now. It will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="adm-input flex-1 break-all">{fresh.key}</code>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(fresh.key)
                  setCopied(true)
                } catch {
                  setCopied(false)
                }
              }}
              className="btn btn-secondary"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={() => {
                setFresh(null)
                setCopied(false)
              }}
              className="btn btn-ghost"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {keys.length === 0 ? (
        <p className="adm-empty">No keys yet.</p>
      ) : (
        <ul className="space-y-2">
          {keys.map((key) => (
            <li key={key.id} className="adm-card flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold">
                  {key.name}{' '}
                  <span className={`adm-badge ${key.revoked ? 'adm-badge--revoked' : 'adm-badge--farmer'}`}>
                    {key.revoked ? 'revoked' : 'active'}
                  </span>
                </p>
                <p className="adm-small">
                  <code>{key.prefix}…</code> · last used{' '}
                  {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'never'}
                </p>
              </div>
              {!key.revoked && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm(`Revoke "${key.name}"? Anything using it stops working immediately.`)) return
                    setError(null)
                    startTransition(async () => {
                      const result = await revokeApiKey(key.id)
                      if (!result.ok) setError(result.error)
                    })
                  }}
                  className="btn btn-ghost adm-danger"
                >
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          const form = e.currentTarget
          const name = (new FormData(form).get('name') as string) ?? ''
          setError(null)
          startTransition(async () => {
            const result = await issueApiKey(name)
            if (result.ok) {
              form.reset()
              setCopied(false)
              setFresh({ name: name.trim(), key: result.key })
            } else {
              setError(result.error)
            }
          })
        }}
        className="flex gap-2 max-w-md"
      >
        <input
          name="name"
          required
          disabled={pending}
          placeholder="What it's for, e.g. MABFC directory: staging"
          className="adm-input flex-1"
        />
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary"
        >
          {pending ? 'Issuing…' : 'Issue key'}
        </button>
      </form>

      {error && (
        <p role="alert" className="adm-alert">
          {error}
        </p>
      )}
    </div>
  )
}
