import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { requireAdmin } from '@/lib/auth/current-user'
import { listPendingUsers } from '@/lib/storage/users'
import { AdminNav } from '@/app/admin/_components/admin-nav'
import './admin.css'

/**
 * The admin shell. Its check protects the first load only — a layout doesn't
 * re-render between its pages, so every page checks for itself too.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()
  // Cheap, ours only: the badge is "farmers waiting for a farm". Uninvited Clerk
  // accounts are counted on the overview, which already pays for the Clerk call.
  const pending = await listPendingUsers()

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-brand">
          Breadbasket
          <small>Admin</small>
        </div>
        <AdminNav waiting={pending.length} />
        <div className="adm-side-foot">
          <Link href="/">Public site ↗</Link>
          <UserButton />
        </div>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  )
}
