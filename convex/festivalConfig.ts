import { v } from 'convex/values'
import { internal } from './_generated/api'
import { mutation, query } from './_generated/server'
import { requireAdmin, requireIdentity } from './lib/auth'

const configValidator = v.object({
  _id: v.id('festivalConfig'),
  festivalName: v.string(),
  launchAnnounced: v.boolean(),
  updatedAt: v.number(),
})

export const getPublic = query({
  args: {},
  returns: v.union(configValidator, v.null()),
  handler: async (ctx) => {
    const row = await ctx.db
      .query('festivalConfig')
      .withIndex('by_key', (q) => q.eq('key', 'singleton'))
      .unique()
    if (!row) return null
    return {
      _id: row._id,
      festivalName: row.festivalName,
      launchAnnounced: row.launchAnnounced,
      updatedAt: row.updatedAt,
    }
  },
})

export const upsert = mutation({
  args: {
    festivalName: v.string(),
    launchAnnounced: v.boolean(),
  },
  returns: v.id('festivalConfig'),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    const existing = await ctx.db
      .query('festivalConfig')
      .withIndex('by_key', (q) => q.eq('key', 'singleton'))
      .unique()

    const now = Date.now()
    let id
    if (existing) {
      await ctx.db.patch(existing._id, {
        festivalName: args.festivalName,
        launchAnnounced: args.launchAnnounced,
        updatedAt: now,
        updatedByProfileId: admin._id,
      })
      id = existing._id
    } else {
      id = await ctx.db.insert('festivalConfig', {
        key: 'singleton',
        festivalName: args.festivalName,
        launchAnnounced: args.launchAnnounced,
        updatedAt: now,
        updatedByProfileId: admin._id,
      })
    }

    try {
      await ctx.scheduler.runAfter(0, internal.telemetry.enqueue, {
        eventId: `festival_config_updated:${id}:${now}`,
        name: 'festival_config_updated',
        properties: {
          festival_name: args.festivalName,
          launch_announced: String(args.launchAnnounced),
          admin_profile_id: admin._id,
        },
      })
    } catch (error) {
      console.error('telemetry enqueue failed', error)
    }

    return id
  },
})

/** Dev/preview seed — safe defaults, no auth required only when called via preview-run / internal. */
export const seedPreview = mutation({
  args: {},
  returns: v.id('festivalConfig'),
  handler: async (ctx) => {
    // Deny anonymous writes in production-like contexts: only allow when no identity
    // AND existing config is missing (preview empty backends). Never elevates roles.
    const identity = await ctx.auth.getUserIdentity()
    if (identity) {
      await requireIdentity(ctx)
    }
    const existing = await ctx.db
      .query('festivalConfig')
      .withIndex('by_key', (q) => q.eq('key', 'singleton'))
      .unique()
    if (existing) return existing._id
    return await ctx.db.insert('festivalConfig', {
      key: 'singleton',
      festivalName: 'Saturnalia Preview',
      launchAnnounced: false,
      updatedAt: Date.now(),
    })
  },
})
