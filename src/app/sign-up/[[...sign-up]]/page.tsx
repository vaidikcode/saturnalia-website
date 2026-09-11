'use client'

import { RedirectToSignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { isConfiguredClerkPublishableKey } from '@/lib/env'

/** Account Portal: redirects into Clerk-hosted sign-up (*.accounts.dev). */
export default function SignUpPage() {
  if (!isConfiguredClerkPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', fontFamily: 'system-ui' }}>
        <div style={{ maxWidth: 480 }}>
          <h1>Sign up</h1>
          <p>
            Add <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and <code>CLERK_SECRET_KEY</code> to{' '}
            <code>.env.local</code> — see <code>docs/dashboard-setup.md</code>.
          </p>
          <p>
            <Link href="/">Back home</Link>
          </p>
        </div>
      </main>
    )
  }

  return <RedirectToSignUp />
}
