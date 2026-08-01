'use client'

import { useTransition } from 'react'
import { createFarm } from '@/app/admin/_actions'

export function CreateFarmForm() {
  const [pending, startTransition] = useTransition()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const id = formData.get('id') as string
        const name = formData.get('name') as string
        const tagline = formData.get('tagline') as string
        const market = formData.get('market') as string
        startTransition(async () => {
          await createFarm(id, name, tagline || undefined, market || undefined)
          ;(e.target as HTMLFormElement).reset()
        })
      }}
      className="space-y-4 max-w-md"
    >
      <div>
        <label htmlFor="id" className="block text-sm font-medium mb-1">
          Farm ID (slug)
        </label>
        <input
          id="id"
          name="id"
          type="text"
          required
          disabled={pending}
          placeholder="e.g., greenacre-farm"
          className="w-full border rounded px-3 py-2 disabled:bg-gray-100"
        />
      </div>
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Farm Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          disabled={pending}
          placeholder="e.g., Greenacre Farm"
          className="w-full border rounded px-3 py-2 disabled:bg-gray-100"
        />
      </div>
      <div>
        <label htmlFor="tagline" className="block text-sm font-medium mb-1">
          Tagline (optional)
        </label>
        <input
          id="tagline"
          name="tagline"
          type="text"
          disabled={pending}
          placeholder="e.g., Organic vegetables and herbs"
          className="w-full border rounded px-3 py-2 disabled:bg-gray-100"
        />
      </div>
      <div>
        <label htmlFor="market" className="block text-sm font-medium mb-1">
          Market (optional)
        </label>
        <input
          id="market"
          name="market"
          type="text"
          disabled={pending}
          placeholder="e.g., farmers market, delivery"
          className="w-full border rounded px-3 py-2 disabled:bg-gray-100"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded px-4 py-2"
      >
        {pending ? 'Creating...' : 'Create Farm'}
      </button>
    </form>
  )
}
