import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/current-user'

/**
 * Where "sign in" and the installed app land: sends each person to their own
 * surface. `?to=stock` (the home-screen shortcut) opens a farmer's stock
 * rather than the conversation.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>
}) {
  const user = await getSessionUser()

  if (!user) {
    redirect('/sign-in')
  }

  if (user.role === 'admin') {
    redirect('/admin')
  }

  if (user.role === 'farmer') {
    const { to } = await searchParams
    redirect(to === 'stock' ? `/farm/${user.farmId}/stock` : `/farm/${user.farmId}`)
  }

  // pending
  redirect('/onboarding')
}
