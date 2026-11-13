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
    <div className="flex items-center gap-3 text-sm">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(resendInvitation, 'Sent again.')}
        className="text-blue-700 underline disabled:text-gray-400"
      >
        Resend
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(revokeInvitation, 'Revoked.')}
        className="text-red-700 underline disabled:text-gray-400"
      >
        Revoke
      </button>
      {message && <span role="status" className="text-gray-600">{message}</span>}
    </div>
  )
}
