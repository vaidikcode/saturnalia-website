'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import Link from 'next/link'
import { api } from '../../../convex/_generated/api'

function isConfiguredClerkKey(key: string | undefined): boolean {
  if (!key) return false
  if (key.includes('placeholder')) return false
  return /^pk_(test|live)_[A-Za-z0-9]{20,}$/.test(key)
}

function isConfiguredConvexUrl(url: string | undefined): boolean {
  return Boolean(url && !url.includes('example.convex.cloud'))
}

function ProfilePanel() {
  const profile = useQuery(api.profiles.getMine)
  if (profile === undefined) return <p>Loading profile…</p>
  if (profile === null) return <p>No profile yet. It is created automatically after Convex auth succeeds.</p>
  return (
    <dl>
      <dt>Name</dt>
      <dd>{profile.name}</dd>
      <dt>Role</dt>
      <dd>{profile.role}</dd>
      <dt>Onboarding complete</dt>
      <dd>{profile.onboardingComplete ? 'yes' : 'no (auth ≠ onboarding)'}</dd>
    </dl>
  )
}

function AuthenticatedAccount() {
  const { user, isLoaded } = useUser()
  const convexEnabled = isConfiguredConvexUrl(process.env.NEXT_PUBLIC_CONVEX_URL)

  if (!isLoaded) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <p>Loading session…</p>
      </main>
    )
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: 640, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Account</h1>
          <p style={{ margin: '0.25rem 0 0', opacity: 0.7 }}>
            Signed in as {user?.primaryEmailAddress?.emailAddress ?? user?.id}
          </p>
        </div>
        <UserButton afterSignOutUrl="/" />
      </header>

      <section style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Application profile</h2>
        {convexEnabled ? <ProfilePanel /> : <p>Set NEXT_PUBLIC_CONVEX_URL to load your Convex profile.</p>}
      </section>

      <p style={{ marginTop: '2rem' }}>
        <Link href="/">← Back to festival site</Link>
      </p>
    </main>
  )
}

export default function AccountPage() {
  if (!isConfiguredClerkKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Account</h1>
        <p>Configure Clerk keys first — see docs/dashboard-setup.md.</p>
        <Link href="/">Back home</Link>
      </main>
    )
  }

  return <AuthenticatedAccount />
}
