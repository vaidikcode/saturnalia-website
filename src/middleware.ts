import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/account(.*)', '/admin(.*)'])

function isConfiguredClerkKey(key: string | undefined): boolean {
  if (!key) return false
  if (key.includes('placeholder')) return false
  return /^pk_(test|live)_[A-Za-z0-9]{20,}$/.test(key)
}

const clerkConfigured = Boolean(
  isConfiguredClerkKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) && process.env.CLERK_SECRET_KEY && !process.env.CLERK_SECRET_KEY.includes('placeholder'),
)

export default clerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        await auth.protect()
      }
    })
  : () => NextResponse.next()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
