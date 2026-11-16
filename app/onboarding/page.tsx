import { SignOutButton } from '@clerk/nextjs'
import { getSessionUser } from '@/lib/auth/current-user'
import { AuthFrame } from '@/app/_components/auth-frame'
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
    <AuthFrame>
      <div
        className="w-full max-w-[400px] rounded-[12px] p-7"
        style={{
          background: 'var(--color-neutral-100)',
          border: '1px solid var(--color-divider)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <h1 className="text-[26px]">Almost there</h1>
        <p className="mt-3" style={{ color: 'var(--color-neutral-700)' }}>
          You&rsquo;re signed in, but your account isn&rsquo;t connected to a farm yet. Someone
          from the Breadbasket team will connect you — once they have, this page takes you
          straight to your farm.
        </p>
        <p className="meta mt-4 text-[12px]" style={{ color: 'var(--color-neutral-700)' }}>
          Joined through your co-op and expected to be in already? Let your co-op contact know.
        </p>
        <div className="mt-6 flex gap-2">
          <a href="/onboarding" className="btn btn-primary">
            Check again
          </a>
          <SignOutButton redirectUrl="/">
            <button type="button" className="btn btn-secondary">
              Sign out
            </button>
          </SignOutButton>
        </div>
      </div>
    </AuthFrame>
  )
}
