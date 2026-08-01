'use client'

import { useTransition } from 'react'
import { assignFarmerToFarm } from '@/app/admin/_actions'
import type { FarmRow } from '@/lib/db/schema'

export function AssignFarmerForm({
  userId,
  userEmail,
  availableFarms,
}: {
  userId: string
  userEmail: string
  availableFarms: FarmRow[]
}) {
  const [pending, startTransition] = useTransition()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const farmId = formData.get('farmId') as string
        startTransition(async () => {
          await assignFarmerToFarm(userId, farmId)
        })
      }}
      className="flex gap-2"
    >
      <select
        name="farmId"
        required
        disabled={pending}
        className="border rounded px-3 py-2 flex-1"
      >
        <option value="">Select a farm...</option>
        {availableFarms.map((farm) => (
          <option key={farm.id} value={farm.id}>
            {farm.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded px-4 py-2"
      >
        {pending ? 'Assigning...' : 'Assign'}
      </button>
    </form>
  )
}
