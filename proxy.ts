import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

/**
 * Routes that don't require authentication.
 *
 * Public routes: buyer page, sign-in/sign-up flow, and the API's OpenAPI
 * document — shared with the directory team, and describing nothing secret.
 *
 * `/api/v1/*` is public **to Clerk only**: the directory has no session, so
 * those handlers authenticate an API key themselves (ticket 36). A handler added
 * under it that forgets to is open to the world — which is why a test fails for
 * any route handler that checks nothing.
 */
const isPublicRoute = createRouteMatcher([
  '/f/(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/openapi.json',
  '/api/v1/(.*)',
])

/**
 * Clerk proxy middleware for Next.js 16.
 *
 * This is the evolved name for middleware.ts in Next.js 16+. It runs before
 * route rendering and enforces "signed in" on protected routes.
 *
 * However, Server Actions are NOT matched by this proxy and must check auth
 * inside the action itself — see requireFarmAccess/requireAdmin in lib/auth.
 */
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files unless specifically matched
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
