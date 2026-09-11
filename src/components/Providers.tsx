'use client'

import { useAuth } from '@clerk/nextjs'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ClerkProvider } from '@clerk/nextjs'
import { useMemo } from 'react'
import { AuthAnalyticsBridge } from '@/components/AuthAnalyticsBridge'
import { EnsureProfile } from '@/components/EnsureProfile'
import { isConfiguredClerkPublishableKey, isConfiguredConvexUrl } from '@/lib/env'

function ConvexTree({ children }: { children: React.ReactNode }) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  const client = useMemo(() => (isConfiguredConvexUrl(url) ? new ConvexReactClient(url) : null), [url])

  if (!client) {
    return children
  }

  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      <EnsureProfile />
      {children}
    </ConvexProviderWithClerk>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!isConfiguredClerkPublishableKey(publishableKey)) {
    return children
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInFallbackRedirectUrl="/account"
      signUpFallbackRedirectUrl="/account"
      afterSignOutUrl="/"
    >
      <AuthAnalyticsBridge />
      <ConvexTree>{children}</ConvexTree>
    </ClerkProvider>
  )
}
