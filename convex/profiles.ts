import { v } from 'convex/values'
import { internal } from './_generated/api'
import { mutation, query } from './_generated/server'
import { getProfileByClerkSubject, requireIdentity } from './lib/auth'

const profileReturn = v.object({
  _id: v.id('profiles'),
  clerkSubject: v.string(),
  email: v.string(),
  name: v.string(),
  onboardingComplete: v.boolean(),
  role: v.union(v.literal('attendee'), v.literal('staff'), v.literal('admin')),
  deactivatedAt: v.optional(v.number()),
})

/**
 * Idempotent profile bootstrap after Clerk sign-in.
 * Authentication ≠ festival onboarding: onboardingComplete stays false until a later flow.
 * First admin only when FIRST_ADMIN_SUBJECT matches and no admin exists.
 * Never grants staff/admin solely because email matches a college domain.
 */
export const ensureProfile = mutation({
  args: {},
  returns: profileReturn,
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx)
    const email = identity.email ?? ''
    const name = identity.name ?? identity.nickname ?? email.split('@')[0] ?? 'Attendee'
    const now = Date.now()

    const existing = await getProfileByClerkSubject(ctx, identity.subject)
    if (existing) {
      if (existing.deactivatedAt) {
        throw new Error('Account deactivated')
      }
      await ctx.db.patch(existing._id, {
        email: email || existing.email,
        name: name || existing.name,
        updatedAt: now,
      })
      const refreshed = await ctx.db.get(existing._id)
      if (!refreshed) throw new Error('Profile missing after update')
      return {
        _id: refreshed._id,
        clerkSubject: refreshed.clerkSubject,
        email: refreshed.email,
        name: refreshed.name,
        onboardingComplete: refreshed.onboardingComplete,
        role: refreshed.role,
        deactivatedAt: refreshed.deactivatedAt,
      }
    }

    const firstAdminSubject = process.env.FIRST_ADMIN_SUBJECT
    let role: 'attendee' | 'admin' = 'attendee'
    if (firstAdminSubject && firstAdminSubject === identity.subject) {
      const existingAdmin = await ctx.db
        .query('profiles')
        .withIndex('by_role', (q) => q.eq('role', 'admin'))
        .first()
      if (!existingAdmin) {
        role = 'admin'
      }
    }

    const id = await ctx.db.insert('profiles', {
      clerkSubject: identity.subject,
      email,
      name,
      onboardingComplete: false,
      role,
      createdAt: now,
      updatedAt: now,
    })

    try {
      await ctx.scheduler.runAfter(0, internal.telemetry.enqueue, {
        eventId: `profile_ensured:${id}`,
        name: 'profile_ensured',
        properties: {
          profile_id: id,
          role,
          distinct_id: identity.subject,
        },
      })
    } catch (error) {
      console.error('telemetry enqueue failed', error)
    }

    const created = await ctx.db.get(id)
    if (!created) throw new Error('Profile missing after insert')
    return {
      _id: created._id,
      clerkSubject: created.clerkSubject,
      email: created.email,
      name: created.name,
      onboardingComplete: created.onboardingComplete,
      role: created.role,
      deactivatedAt: created.deactivatedAt,
    }
  },
})

export const getMine = query({
  args: {},
  returns: v.union(profileReturn, v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    const profile = await getProfileByClerkSubject(ctx, identity.subject)
    if (!profile || profile.deactivatedAt) return null
    return {
      _id: profile._id,
      clerkSubject: profile.clerkSubject,
      email: profile.email,
      name: profile.name,
      onboardingComplete: profile.onboardingComplete,
      role: profile.role,
      deactivatedAt: profile.deactivatedAt,
    }
  },
})
