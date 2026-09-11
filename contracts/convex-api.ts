import { anyApi } from 'convex/server'

/**
 * Checked-in contract for the Expo app (stktyagi/Sat-app-26).
 * After linking Convex, regenerate with: `bun run export:api`
 * Until then this mirrors the public API surface used by the website.
 */
export const api = anyApi as unknown as PublicApiType

export type PublicApiType = {
  festivalConfig: {
    getPublic: {
      _type: 'query'
      _visibility: 'public'
      _args: Record<string, never>
      _returnType: {
        _id: string
        festivalName: string
        launchAnnounced: boolean
        updatedAt: number
      } | null
    }
    upsert: {
      _type: 'mutation'
      _visibility: 'public'
      _args: { festivalName: string; launchAnnounced: boolean }
      _returnType: string
    }
    seedPreview: {
      _type: 'mutation'
      _visibility: 'public'
      _args: Record<string, never>
      _returnType: string
    }
  }
  profiles: {
    ensureProfile: {
      _type: 'mutation'
      _visibility: 'public'
      _args: Record<string, never>
      _returnType: {
        _id: string
        clerkSubject: string
        email: string
        name: string
        onboardingComplete: boolean
        role: 'attendee' | 'staff' | 'admin'
        deactivatedAt?: number
      }
    }
    getMine: {
      _type: 'query'
      _visibility: 'public'
      _args: Record<string, never>
      _returnType: {
        _id: string
        clerkSubject: string
        email: string
        name: string
        onboardingComplete: boolean
        role: 'attendee' | 'staff' | 'admin'
        deactivatedAt?: number
      } | null
    }
  }
  telemetry: {
    getOutboxStats: {
      _type: 'query'
      _visibility: 'public'
      _args: Record<string, never>
      _returnType: { undeliveredSample: number }
    }
  }
  webhooks: {
    applyClerkUserEvent: {
      _type: 'mutation'
      _visibility: 'public'
      _args: {
        bridgeSecret: string
        clerkSubject: string
        email?: string
        name?: string
        deleted?: boolean
      }
      _returnType: null
    }
  }
}
