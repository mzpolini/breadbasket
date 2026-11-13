'use client'

import { useState, useTransition } from 'react'
import { inviteToFarm } from '@/app/admin/_actions'

export function InviteForm({ farmId }: { farmId: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const form = e.currentTarget
        const data = new FormData(form)
        const email = (data.get('email') as string) ?? ''
        setError(null)
        setSentTo(null)
        startTransition(async () => {
          const result = await inviteToFarm({
            farmId,
            email,
            role: data.get('role') === 'admin' ? 'admin' : 'farmer',
            attested: data.get('attested') === 'on',
          })
          if (result.ok) {
            form.reset()
            setSentTo(email.trim().toLowerCase())
          } else {
            setError(result.error)
          }
        })
      }}
      className="space-y-4 max-w-md"
    >
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          disabled={pending}
          className="w-full border rounded px-3 py-2 disabled:bg-gray-100"
        />
      </div>
      <div className="flex items-start gap-2">
        <input id="attested" name="attested" type="checkbox" required disabled={pending} className="mt-1" />
        <label htmlFor="attested" className="text-sm">
          Email matches this person&rsquo;s MABFC member record.
        </label>
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-1">
          Role
        </label>
        <select id="role" name="role" defaultValue="farmer" disabled={pending} className="border rounded px-3 py-2">
          <option value="farmer">Farmer</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {sentTo && (
        <p role="status" className="text-sm text-green-800">
          Invitation sent to {sentTo}.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded px-4 py-2"
      >
        {pending ? 'Sending...' : 'Send invitation'}
      </button>
    </form>
  )
}
