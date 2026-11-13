'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createFarm } from '@/app/admin/_actions'

const input = 'w-full border rounded px-3 py-2 disabled:bg-gray-100'

export function CreateFarmForm() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<string | null>(null)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const form = e.currentTarget
        const data = new FormData(form)
        const text = (key: string) => (data.get(key) as string | null) ?? ''
        setError(null)
        setCreated(null)
        startTransition(async () => {
          const result = await createFarm({
            name: text('name'),
            slug: text('slug'),
            directoryProfileId: text('directoryProfileId'),
            kyfVerified: data.get('kyfVerified') === 'on',
            tagline: text('tagline'),
            market: text('market'),
          })
          if (result.ok) {
            form.reset()
            setCreated(result.farmId)
          } else {
            setError(result.error)
          }
        })
      }}
      className="space-y-4 max-w-md"
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Farm name
        </label>
        <input id="name" name="name" type="text" required disabled={pending} placeholder="e.g., Greenacre Farm" className={input} />
      </div>
      <div>
        <label htmlFor="slug" className="block text-sm font-medium mb-1">
          Farm stand URL (/f/…)
        </label>
        <input id="slug" name="slug" type="text" required disabled={pending} placeholder="e.g., greenacre-farm" className={input} />
        <p className="text-xs text-gray-500 mt-1">
          What customers type. It can be changed later; the farm&rsquo;s ID, which the directory
          uses, cannot.
        </p>
      </div>
      <div>
        <label htmlFor="directoryProfileId" className="block text-sm font-medium mb-1">
          MABFC directory profile ID (optional)
        </label>
        <input id="directoryProfileId" name="directoryProfileId" type="text" disabled={pending} className={input} />
        <p className="text-xs text-gray-500 mt-1">A farm without one never appears in the directory API.</p>
      </div>
      <div className="flex items-center gap-2">
        <input id="kyfVerified" name="kyfVerified" type="checkbox" disabled={pending} />
        <label htmlFor="kyfVerified" className="text-sm">
          KYF-verified <span className="text-gray-500">(only verified farms get a public stand)</span>
        </label>
      </div>
      <div>
        <label htmlFor="tagline" className="block text-sm font-medium mb-1">
          Tagline (optional)
        </label>
        <input id="tagline" name="tagline" type="text" disabled={pending} placeholder="e.g., Organic vegetables and herbs" className={input} />
      </div>
      <div>
        <label htmlFor="market" className="block text-sm font-medium mb-1">
          Market (optional)
        </label>
        <input id="market" name="market" type="text" disabled={pending} placeholder="e.g., at the market Saturdays, 8–1" className={input} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {created && (
        <p role="status" className="text-sm text-green-800">
          Farm created.{' '}
          <Link href={`/admin/farms/${created}`} className="underline">
            Invite its people
          </Link>
        </p>
      )}
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
