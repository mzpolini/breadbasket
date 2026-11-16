import Link from 'next/link'
import { connection } from 'next/server'
import { fillDays, fullTime, lastSeen } from '@/lib/admin'
import { requireAdmin } from '@/lib/auth/current-user'
import { activityByFarm, dailyActivity, usageSince } from '@/lib/storage/admin'
import { listFarms } from '@/lib/storage/farms'
import { loadPeople } from '@/app/admin/_data'
import { DailyBars, StatusBadge, Tile, When } from '@/app/admin/_components/ui'

const DAY = 24 * 60 * 60 * 1000
const CHART_DAYS = 14

/** The pilot at a glance: who's in, who's using it, and which farms have gone quiet. */
export default async function AdminOverviewPage() {
  await requireAdmin()
  await connection()
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * DAY)

  const [{ people, summary, clerkReachable }, farms, byFarm, daily, usage] = await Promise.all([
    loadPeople(now),
    listFarms(),
    activityByFarm(weekAgo),
    dailyActivity(new Date(now.getTime() - (CHART_DAYS + 1) * DAY)),
    usageSince(weekAgo),
  ])

  const days = fillDays(daily, CHART_DAYS, now)
  const farmsActive = farms.filter((f) => (byFarm.get(f.id)?.messages7d ?? 0) > 0).length
  const recent = people
    .filter((p) => p.clerkId)
    .sort((a, b) => lastSeen(b) - lastSeen(a))
    .slice(0, 8)
  const farmRows = farms
    .map((farm) => ({ farm, activity: byFarm.get(farm.id) }))
    .sort(
      (a, b) =>
        (b.activity?.lastSpokenAt?.getTime() ?? 0) - (a.activity?.lastSpokenAt?.getTime() ?? 0),
    )
  const farmName = new Map(farms.map((f) => [f.id, f.name]))

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Overview</h1>
          <p className="adm-sub">The pilot at a glance · as of {fullTime(now)}</p>
        </div>
      </header>

      {!clerkReachable && (
        <p className="adm-notice" role="status">
          Couldn&rsquo;t reach Clerk, so sign-in times are missing and account counts only include
          people with a farm or role.
        </p>
      )}

      <section aria-label="People">
        <div className="adm-tiles adm-tiles--6">
          <Tile label="Accounts" value={summary.accounts} note="Signed up with Clerk" href="/admin/people" />
          <Tile
            label="Have signed in"
            value={summary.signedIn}
            note={`${summary.posted} have sent a message`}
            href="/admin/people"
          />
          <Tile label="Active today" value={summary.active24h} note="Last 24 hours" />
          <Tile label="Active this week" value={summary.active7d} note="Last 7 days" />
          <Tile
            label="Waiting for a farm"
            value={summary.waiting}
            note={summary.waiting ? 'Assign or ignore them' : 'Nobody waiting'}
            href="/admin/people?status=waiting"
            accent={summary.waiting > 0}
          />
          <Tile
            label="Open invitations"
            value={summary.invitations.open}
            note={`${summary.invitations.accepted} accepted · ${summary.invitations.revoked} revoked`}
            href="/admin/people?status=invited"
          />
        </div>
      </section>

      <section className="adm-section" aria-label="Usage this week">
        <div className="adm-section-head">
          <h2>This week</h2>
          <span className="adm-small">Last 7 days, every farm</span>
        </div>
        <div className="adm-tiles adm-tiles--6">
          <Tile label="Farms" value={farms.length} note={`${farms.filter((f) => f.kyfVerified).length} KYF-verified`} href="/admin/farms" />
          <Tile label="Farms active" value={farmsActive} note={`of ${farms.length}, sent a message`} />
          <Tile label="Messages sent" value={usage.messages7d} note="By farmers, to Breadbasket" />
          <Tile label="Read-backs approved" value={usage.published7d} note="Published to the stand" />
          <Tile label="Stock changes" value={usage.movements7d} note="Rows written to the ledger" />
          <Tile label="Notes kept" value={usage.notes7d} note="Rhythms, plans, context" />
        </div>
      </section>

      <section className="adm-section adm-card" aria-labelledby="daily-heading">
        <div className="adm-section-head">
          <h2 id="daily-heading">Messages per day</h2>
          <span className="adm-small">
            Last {CHART_DAYS} days · {days.reduce((n, d) => n + d.messages, 0)} in all
          </span>
        </div>
        <DailyBars days={days} />
      </section>

      <div className="adm-section adm-grid-2">
        <section className="adm-card" aria-labelledby="recent-heading">
          <div className="adm-section-head">
            <h2 id="recent-heading">Recently seen</h2>
            <Link href="/admin/people">Everyone →</Link>
          </div>
          {recent.length === 0 ? (
            <p className="adm-empty">Nobody has signed in yet.</p>
          ) : (
            <ul className="adm-list">
              {recent.map((p) => (
                <li key={p.key}>
                  <span className="min-w-0">
                    <span className="adm-email">{p.email ?? p.clerkId}</span>{' '}
                    <StatusBadge status={p.status} />
                    <br />
                    <span className="adm-small">
                      {p.farmId ? farmName.get(p.farmId) ?? p.farmId : 'No farm'}
                      {p.messages > 0 && ` · ${p.messages} message${p.messages === 1 ? '' : 's'}`}
                    </span>
                  </span>
                  <span className="adm-small text-right">
                    <When at={p.lastActiveAt ?? p.lastSignInAt ?? p.lastPostedAt} now={now} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="adm-card" aria-labelledby="farms-heading">
          <div className="adm-section-head">
            <h2 id="farms-heading">Farms by last spoken</h2>
            <Link href="/admin/farms">All farms →</Link>
          </div>
          {farmRows.length === 0 ? (
            <p className="adm-empty">No farms yet.</p>
          ) : (
            <ul className="adm-list">
              {farmRows.slice(0, 8).map(({ farm, activity }) => (
                <li key={farm.id}>
                  <span className="min-w-0">
                    <Link href={`/admin/farms/${farm.id}`} className="adm-email">
                      {farm.name}
                    </Link>
                    <br />
                    <span className="adm-small">
                      {activity?.people ?? 0} {activity?.people === 1 ? 'person' : 'people'} ·{' '}
                      {activity?.messages7d ?? 0} messages this week
                    </span>
                  </span>
                  <span className="adm-small text-right">
                    {activity?.lastSpokenAt ? <When at={activity.lastSpokenAt} now={now} /> : 'never'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
