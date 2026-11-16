import { SignIn } from '@clerk/nextjs'
import { AuthFrame } from '@/app/_components/auth-frame'

export default function Page() {
  return (
    <AuthFrame>
      <SignIn fallbackRedirectUrl="/account" />
    </AuthFrame>
  )
}
