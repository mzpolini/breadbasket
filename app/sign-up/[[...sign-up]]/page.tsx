import { SignUp } from '@clerk/nextjs'
import { AuthFrame } from '@/app/_components/auth-frame'

export default function Page() {
  return (
    <AuthFrame>
      <SignUp fallbackRedirectUrl="/account" />
    </AuthFrame>
  )
}
