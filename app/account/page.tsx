import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/current-user'

export default async function Home() {
  const user = await getSessionUser()

  if (!user) {
    redirect('/sign-in')
  }

  if (user.role === 'admin') {
    redirect('/admin')
  }

  if (user.role === 'farmer') {
    redirect(`/farm/${user.farmId}`)
  }

  // pending
  redirect('/onboarding')
}
