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
        className="adm-input flex-1"
      >
        <option value="">Choose a farm…</option>
        {availableFarms.map((farm) => (
          <option key={farm.id} value={farm.id}>
            {farm.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary"
      >
        {pending ? 'Assigning…' : 'Assign'}
      </button>
    </form>
  )
}
