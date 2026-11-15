import Link from 'next/link'
import { type PersonRow } from '@/lib/admin'
import { requireAdmin } from '@/lib/auth/current-user'
import { listFarms } from '@/lib/storage/farms'
import { loadPeople } from '@/app/admin/_data'
import { AssignFarmerForm } from '@/app/admin/_components/assign-farmer-form'
import { StatusBadge, When } from '@/app/admin/_components/ui'

const FILTERS = {
  all: { label: 'Everyone', test: () => true },
  in: { label: 'On a farm', test: (p: PersonRow) => p.status === 'farmer' || p.status === 'admin' },
  waiting: {
    label: 'Waiting for a farm',
    test: (p: PersonRow) => p.status === 'pending' || p.status === 'uninvited',
  },
  invited: { label: 'Invited, no account', test: (p: PersonRow) => p.status === 'invited' },
  revoked: { label: 'Revoked', test: (p: PersonRow) => p.status === 'revoked' },
} as const

type FilterKey = keyof typeof FILTERS

/**
 * Everyone who has an account or has been asked in — who they are, which farm,
 * who invited them, and when they last signed in and last posted.
 */
export default async function AdminPeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; farm?: string }>
}) {
  await requireAdmin()
  const { status, farm: farmFilter } = await searchParams
  const filter: FilterKey = status && status in FILTERS ? (status as FilterKey) : 'all'
  const now = new Date()

  const [{ people, clerkReachable, emailById }, farms] = await Promise.all([
    loadPeople(now),
    listFarms(),
  ])
  const farmName = new Map(farms.map((f) => [f.id, f.name]))
  const inFarm = farmFilter
    ? people.filter((p) => (p.farmId ?? p.invitation?.farmId) === farmFilter)
    : people
  const shown = inFarm.filter(FILTERS[filter].test)

  const href = (key: FilterKey) => {
    const params = new URLSearchParams()
    if (key !== 'all') params.set('status', key)
    if (farmFilter) params.set('farm', farmFilter)
    const q = params.toString()
    return `/admin/people${q ? `?${q}` : ''}`
  }

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>People</h1>
          <p className="adm-sub">
            {people.filter((p) => p.clerkId).length} accounts ·{' '}
            {people.filter((p) => p.status === 'invited').length} invited without an account yet
            {farmFilter && (
              <>
                {' '}
                · showing <strong>{farmName.get(farmFilter) ?? farmFilter}</strong> only (
                <Link href={filter === 'all' ? '/admin/people' : `/admin/people?status=${filter}`} className="underline">
                  clear
                </Link>
                )
              </>
            )}
          </p>
        </div>
        <form className="flex gap-2 items-center" action="/admin/people">
          {filter !== 'all' && <input type="hidden" name="status" value={filter} />}
          <label htmlFor="farm" className="adm-small">
            Farm
          </label>
          <select
            id="farm"
            name="farm"
            defaultValue={farmFilter ?? ''}
            className="border rounded px-2 py-1 text-sm bg-white"
          >
            <option value="">All farms</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <button type="submit" className="border rounded px-3 py-1 text-sm bg-white">
            Show
          </button>
        </form>
      </header>

      {!clerkReachable && (
        <p className="adm-notice" role="status">
          Couldn&rsquo;t reach Clerk: sign-in times are missing, and people who signed up without an
          invitation aren&rsquo;t listed.
        </p>
      )}

      <nav className="adm-tabs" aria-label="Filter people">
        {(Object.keys(FILTERS) as FilterKey[]).map((key) => (
          <Link key={key} href={href(key)} aria-current={key === filter ? 'true' : undefined}>
            {FILTERS[key].label}
            <span>{inFarm.filter(FILTERS[key].test).length}</span>
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <p className="adm-empty">Nobody here.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Person</th>
                <th>Status</th>
                <th>Farm</th>
                <th>Invited</th>
                <th>First sign-in</th>
                <th>Last sign-in</th>
                <th>Last active</th>
                <th>Last posted</th>
                <th className="num">Messages</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => {
                const farmId = p.farmId ?? p.invitation?.farmId ?? null
                const waiting = (p.status === 'pending' || p.status === 'uninvited') && p.clerkId
                return (
                  <tr key={p.key}>
                    <td>
                      <div className="adm-email">{p.email ?? <span className="adm-muted">no email</span>}</div>
                      {p.name && <div className="adm-small">{p.name}</div>}
                      {waiting && (
                        <div className="mt-2 min-w-[260px]">
                          <AssignFarmerForm
                            userId={p.clerkId!}
                            userEmail={p.email ?? p.clerkId!}
                            availableFarms={farms}
                          />
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>
                      {farmId ? (
                        <Link href={`/admin/farms/${farmId}`}>{farmName.get(farmId) ?? farmId}</Link>
                      ) : (
                        <span className="adm-muted">—</span>
                      )}
                    </td>
                    <td className="when">
                      {p.invitation ? (
                        <>
                          <When at={p.invitation.invitedAt} now={now} />
                          <div className="adm-small">
                            by {emailById.get(p.invitation.invitedBy) ?? p.invitation.invitedBy} ·{' '}
                            {p.invitation.state}
                          </div>
                        </>
                      ) : (
                        <span className="adm-muted">not invited</span>
                      )}
                    </td>
                    <td className="when">
                      <When at={p.clerkId ? p.firstSeenAt : null} now={now} />
                    </td>
                    <td className="when">
                      <When at={p.lastSignInAt} now={now} />
                    </td>
                    <td className="when">
                      <When at={p.lastActiveAt} now={now} />
                    </td>
                    <td className="when">
                      <When at={p.lastPostedAt} now={now} />
                    </td>
                    <td className="num">{p.messages || <span className="adm-muted">0</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
