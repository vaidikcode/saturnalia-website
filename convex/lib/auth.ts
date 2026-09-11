import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

type Ctx = QueryCtx | MutationCtx

export async function getIdentityOrNull(ctx: Ctx) {
  return await ctx.auth.getUserIdentity()
}

export async function requireIdentity(ctx: Ctx) {
  const identity = await getIdentityOrNull(ctx)
  if (!identity) {
    throw new Error('Not authenticated')
  }
  return identity
}

export async function getProfileByClerkSubject(ctx: Ctx, clerkSubject: string) {
  return await ctx.db
    .query('profiles')
    .withIndex('by_clerk_subject', (q) => q.eq('clerkSubject', clerkSubject))
    .unique()
}

export async function getCurrentProfileOrNull(ctx: Ctx): Promise<Doc<'profiles'> | null> {
  const identity = await getIdentityOrNull(ctx)
  if (!identity) return null
  return await getProfileByClerkSubject(ctx, identity.subject)
}

export async function requireCurrentProfile(ctx: Ctx): Promise<Doc<'profiles'>> {
  const identity = await requireIdentity(ctx)
  const profile = await getProfileByClerkSubject(ctx, identity.subject)
  if (!profile) {
    throw new Error('Profile not found')
  }
  if (profile.deactivatedAt) {
    throw new Error('Account deactivated')
  }
  return profile
}

export async function requireAdmin(ctx: Ctx): Promise<Doc<'profiles'>> {
  const profile = await requireCurrentProfile(ctx)
  if (profile.role !== 'admin') {
    throw new Error('Admin access required')
  }
  return profile
}

export async function requireStaffOrAdmin(ctx: Ctx): Promise<Doc<'profiles'>> {
  const profile = await requireCurrentProfile(ctx)
  if (profile.role !== 'admin' && profile.role !== 'staff') {
    throw new Error('Staff access required')
  }
  return profile
}

export type ProfileId = Id<'profiles'>
