import { getSessionUser, requireFarmAccess } from '@/lib/auth/current-user'
import { redirect } from 'next/navigation'

/**
 * Onboarding for newly signed-up farmers.
 *
 * They're here because they don't have a farm assigned yet.
 * An admin needs to assign them on the admin page.
 */
export default async function OnboardingPage() {
  const user = await getSessionUser()

  if (!user) {
    redirect('/sign-in')
  }

  if (user.role === 'farmer' && user.farmId) {
    redirect(`/farm/${user.farmId}`)
  }

  if (user.role === 'admin') {
    redirect('/admin')
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="text-2xl font-bold">Welcome to BreadBasket</h1>
        <p className="mt-4 text-gray-600">
          You're signed in, but an admin needs to connect you to a farm before you can
          get started. Check back soon, or let an admin know you're waiting.
        </p>
      </div>
    </main>
  )
}
