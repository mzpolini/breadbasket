import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/current-user'
import { activityByFarm } from '@/lib/storage/admin'
import { listFarms } from '@/lib/storage/farms'
import { CreateFarmForm } from '@/app/admin/_components/create-farm-form'
import { When } from '@/app/admin/_components/ui'

const DAY = 24 * 60 * 60 * 1000

/** Every farm, quiet ones at the bottom so they stand out — and the form to add one. */
export default async function AdminFarmsPage() {
  await requireAdmin()
  const now = new Date()
  const [farms, byFarm] = await Promise.all([
    listFarms(),
    activityByFarm(new Date(now.getTime() - 7 * DAY)),
  ])
  const rows = farms
    .map((farm) => ({ farm, a: byFarm.get(farm.id) }))
    .sort((x, y) => (y.a?.lastSpokenAt?.getTime() ?? 0) - (x.a?.lastSpokenAt?.getTime() ?? 0))

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Farms</h1>
          <p className="adm-sub">
            {farms.length} farms · {farms.filter((f) => f.kyfVerified).length} KYF-verified ·
            sorted by when they last spoke
          </p>
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="adm-empty">No farms yet — add the first one below.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Farm</th>
                <th>Stand</th>
                <th className="num">People</th>
                <th className="num">Open invites</th>
                <th>Last spoken</th>
                <th className="num">Messages (7 d)</th>
                <th className="num">Stock changes (7 d)</th>
                <th className="num">Messages (all)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ farm, a }) => (
                <tr key={farm.id}>
                  <td>
                    <Link href={`/admin/farms/${farm.id}`}>{farm.name}</Link>
                    {farm.tagline && <div className="adm-small">{farm.tagline}</div>}
                  </td>
                  <td>
                    <code className="text-xs">/f/{farm.slug}</code>
                    <div className="adm-small">{farm.kyfVerified ? 'KYF-verified' : 'not verified'}</div>
                  </td>
                  <td className="num">{a?.people ?? 0}</td>
                  <td className="num">{a?.openInvitations ?? 0}</td>
                  <td className="when">
                    {a?.lastSpokenAt ? <When at={a.lastSpokenAt} now={now} /> : <span className="adm-muted">never</span>}
                  </td>
                  <td className="num">{a?.messages7d ?? 0}</td>
                  <td className="num">{a?.movements7d ?? 0}</td>
                  <td className="num">{a?.messagesTotal ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="adm-section adm-card max-w-xl" aria-labelledby="create-heading">
        <h2 id="create-heading">Add a farm</h2>
        <CreateFarmForm />
      </section>
    </>
  )
}
