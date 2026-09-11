'use client'

import { useConvexAuth, useMutation } from 'convex/react'
import { useEffect, useRef } from 'react'
import { api } from '../../convex/_generated/api'

/** Ensures an application profile exists once Convex auth is ready. */
export function EnsureProfile() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const ensureProfile = useMutation(api.profiles.ensureProfile)
  const ran = useRef(false)

  useEffect(() => {
    if (isLoading || !isAuthenticated || ran.current) return
    ran.current = true
    void ensureProfile({}).catch((error: unknown) => {
      console.error('ensureProfile failed', error)
      ran.current = false
    })
  }, [isAuthenticated, isLoading, ensureProfile])

  return null
}
