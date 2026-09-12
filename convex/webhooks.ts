import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { getProfileByClerkSubject } from './lib/auth'
import { reportBackendError } from './lib/reportError'

/**
 * Bridge from the Next.js Clerk webhook route into Convex.
 * Requires CLERK_CONVEX_WEBHOOK_BRIDGE_SECRET on both Next.js and Convex.
 */
export const applyClerkUserEvent = mutation({
  args: {
    bridgeSecret: v.string(),
    clerkSubject: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    deleted: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const expected = process.env.CLERK_CONVEX_WEBHOOK_BRIDGE_SECRET
      if (!expected || args.bridgeSecret !== expected) {
        throw new Error('Unauthorized webhook bridge')
      }

      const existing = await getProfileByClerkSubject(ctx, args.clerkSubject)
      if (!existing) return null

      if (args.deleted) {
        await ctx.db.patch(existing._id, { deactivatedAt: Date.now(), updatedAt: Date.now() })
        return null
      }

      await ctx.db.patch(existing._id, {
        email: args.email ?? existing.email,
        name: args.name ?? existing.name,
        updatedAt: Date.now(),
      })
      return null
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      // Auth failures are expected noise; still surface unexpected DB/runtime errors.
      if (message !== 'Unauthorized webhook bridge') {
        await reportBackendError(ctx, {
          source: 'webhooks.applyClerkUserEvent',
          error,
          distinctId: args.clerkSubject,
        })
      }
      throw error
    }
  },
})
