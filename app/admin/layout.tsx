import { requireAdmin } from '@/lib/auth/current-user'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()
  return children
}
