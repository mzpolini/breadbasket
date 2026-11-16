'use client'

import { useState, useTransition } from 'react'
import { resendInvitation, revokeInvitation } from '@/app/admin/_actions'

/** Resend and revoke for one open invitation. */
export function InvitationActions({ invitationId }: { invitationId: string }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function run(action: (id: string) => ReturnType<typeof resendInvitation>, done: string) {
    setMessage(null)
    startTransition(async () => {
      const result = await action(invitationId)
      setMessage(result.ok ? done : result.error)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(resendInvitation, 'Sent again.')}
        className="btn btn-secondary"
      >
        Resend
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(revokeInvitation, 'Revoked.')}
        className="btn btn-ghost adm-danger"
      >
        Revoke
      </button>
      {message && <span role="status" className="adm-small">{message}</span>}
    </div>
  )
}
