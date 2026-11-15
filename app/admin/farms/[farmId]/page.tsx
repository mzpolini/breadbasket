import Link from 'next/link'
import { notFound } from 'next/navigation'
import { InvitationActions } from '@/app/admin/_components/invitation-actions'
import { InviteForm } from '@/app/admin/_components/invite-form'
import { requireAdmin } from '@/lib/auth/current-user'
import { farmStandUrl } from '@/lib/farms'
import { invitationState } from '@/lib/invitations'
import { getFarm } from '@/lib/storage/farms'
import { invitationsForFarm } from '@/lib/storage/invitations'
import { activityByFarm, postingByPerson } from '@/lib/storage/admin'
import { listUsersByFarm } from '@/lib/storage/users'
import { Tile, When } from '@/app/admin/_components/ui'

const DAY = 24 * 60 * 60 * 1000

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

  const now = new Date()
  const [people, invitations, byFarm, posting] = await Promise.all([
    listUsersByFarm(farm.id),
    invitationsForFarm(farm.id),
    activityByFarm(new Date(now.getTime() - 7 * DAY)),
    postingByPerson(),
  ])
  const activity = byFarm.get(farm.id)
  const postingById = new Map(posting.map((p) => [p.postedBy, p]))
  const openInvitations = invitations.filter((i) => invitationState(i) === 'open').length

  return (
    <>
      <Link href="/admin/farms" className="adm-crumb">
        ← Farms
      </Link>
      <header className="adm-head mt-2">
        <div>
          <h1>{farm.name}</h1>
          <p className="adm-sub">
            <code>{farm.id}</code> · stand at <code>{farmStandUrl(farm)}</code> ·{' '}
            {farm.kyfVerified ? 'KYF-verified' : 'not KYF-verified (no public stand)'}
          </p>
          <div className="adm-links">
            <Link href={`/farm/${farm.id}`}>Open chat as this farm</Link>
            <Link href={`/farm/${farm.id}/stock`}>Stock</Link>
            <Link href={`/farm/${farm.id}/preview`}>Stand preview</Link>
            <Link href={`/admin/people?farm=${farm.id}`}>People on this farm</Link>
          </div>
        </div>
      </header>

      <div className="adm-tiles adm-tiles--4">
        <Tile label="People" value={people.length} note={`${openInvitations} invitation${openInvitations === 1 ? '' : 's'} open`} />
        <Tile
          label="Last spoken"
          value={activity?.lastSpokenAt ? <When at={activity.lastSpokenAt} now={now} /> : 'never'}
        />
        <Tile label="Messages this week" value={activity?.messages7d ?? 0} note={`${activity?.messagesTotal ?? 0} all time`} />
        <Tile label="Stock changes this week" value={activity?.movements7d ?? 0} />
      </div>

      <section className="adm-section">
        <h2>People</h2>
        {people.length === 0 ? (
          <p className="adm-empty">Nobody has signed in to this farm yet.</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Last posted</th>
                  <th className="num">Messages</th>
                </tr>
              </thead>
              <tbody>
                {people.map((person) => {
                  const p = postingById.get(person.id)
                  return (
                    <tr key={person.id}>
                      <td className="adm-email">{person.email ?? person.id}</td>
                      <td>{person.role}</td>
                      <td className="when"><When at={person.createdAt} now={now} /></td>
                      <td className="when"><When at={p?.lastPostedAt ?? null} now={now} /></td>
                      <td className="num">{p?.messages ?? 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="adm-section">
        <h2>Invitations</h2>
        {invitations.length === 0 ? (
          <p className="adm-empty">Nobody has been invited yet.</p>
        ) : (
          <ul className="space-y-3">
            {invitations.map((invitation) => {
              const state = invitationState(invitation)
              return (
                <li key={invitation.id} className="adm-card space-y-2">
                  <div>
                    <span className="font-semibold">{invitation.email}</span>{' '}
                    <span className="adm-small">
                      · {invitation.role} · {state} · sent <When at={invitation.invitedAt} now={now} />
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

      <section className="adm-section adm-card max-w-xl">
        <h2>Invite someone</h2>
        <InviteForm farmId={farm.id} />
      </section>
    </>
  )
}
