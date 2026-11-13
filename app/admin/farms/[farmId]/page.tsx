import Link from 'next/link'
import { notFound } from 'next/navigation'
import { InvitationActions } from '@/app/admin/_components/invitation-actions'
import { InviteForm } from '@/app/admin/_components/invite-form'
import { requireAdmin } from '@/lib/auth/current-user'
import { farmStandUrl } from '@/lib/farms'
import { invitationState } from '@/lib/invitations'
import { getFarm } from '@/lib/storage/farms'
import { invitationsForFarm } from '@/lib/storage/invitations'
import { listUsersByFarm } from '@/lib/storage/users'

/**
 * One farm, from the admin's side: who is on it and who has been asked.
 *
 * Checks for an admin itself — the admin layout does not re-render between its
 * pages, so it can't be what protects this one.
 */
export default async function AdminFarmPage({
  params,
}: {
  params: Promise<{ farmId: string }>
}) {
  await requireAdmin()
  const { farmId } = await params

  const farm = await getFarm(farmId)
  if (!farm) notFound()

  const [people, invitations] = await Promise.all([
    listUsersByFarm(farm.id),
    invitationsForFarm(farm.id),
  ])

  return (
    <main className="max-w-4xl mx-auto p-6">
      <Link href="/admin" className="text-sm text-blue-600 hover:underline">
        ← Admin
      </Link>
      <h1 className="text-4xl font-bold mt-2">{farm.name}</h1>
      <p className="text-sm text-gray-600 mt-1">
        <code>{farm.id}</code> · stand at{' '}
        <code>{farmStandUrl(farm)}</code> ·{' '}
        {farm.kyfVerified ? 'KYF-verified' : 'not KYF-verified (no public stand)'}
      </p>
      <p className="text-sm mt-2">
        <Link href={`/farm/${farm.id}`} className="text-blue-600 hover:underline">
          Open as this farm
        </Link>
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">People</h2>
        {people.length === 0 ? (
          <p className="text-gray-600">Nobody has signed in to this farm yet.</p>
        ) : (
          <ul className="space-y-2">
            {people.map((person) => (
              <li key={person.id} className="border rounded p-3">
                <span className="font-semibold">{person.email ?? person.id}</span>{' '}
                <span className="text-sm text-gray-600">· {person.role}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 border-t pt-8">
        <h2 className="text-2xl font-semibold mb-4">Invitations</h2>
        {invitations.length === 0 ? (
          <p className="text-gray-600">Nobody has been invited yet.</p>
        ) : (
          <ul className="space-y-3">
            {invitations.map((invitation) => {
              const state = invitationState(invitation)
              return (
                <li key={invitation.id} className="border rounded p-3 space-y-2">
                  <div>
                    <span className="font-semibold">{invitation.email}</span>{' '}
                    <span className="text-sm text-gray-600">
                      · {invitation.role} · {state}
                    </span>
                  </div>
                  {state === 'open' && (
                    <>
                      {invitation.url && (
                        <p className="text-xs text-gray-600 break-all">
                          If the email doesn&rsquo;t arrive, send this link by hand:{' '}
                          <code>{invitation.url}</code>
                        </p>
                      )}
                      <InvitationActions invitationId={invitation.id} />
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="mt-10 border-t pt-8">
        <h2 className="text-2xl font-semibold mb-4">Invite someone</h2>
        <InviteForm farmId={farm.id} />
      </section>
    </main>
  )
}
