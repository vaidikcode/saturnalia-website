'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect, useRef } from 'react'
import { identifyUser, resetUser } from '@/lib/telemetry'

/**
 * Connects Clerk session changes to PostHog identify/reset without duplicating
 * business-success events (registration etc. stay separate).
 */
export function AuthAnalyticsBridge() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const wasSignedIn = useRef(false)

  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn && userId) {
      identifyUser(userId)
      wasSignedIn.current = true
      return
    }
    if (wasSignedIn.current && !isSignedIn) {
      resetUser()
      wasSignedIn.current = false
    }
  }, [isLoaded, isSignedIn, userId])

  return null
}
