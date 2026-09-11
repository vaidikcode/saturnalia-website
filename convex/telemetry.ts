import { v } from 'convex/values'
import { internalMutation, internalQuery, query } from './_generated/server'
import { backendEventValidator } from './lib/events'

export const enqueue = internalMutation({
  args: {
    eventId: v.string(),
    name: backendEventValidator,
    properties: v.record(v.string(), v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('telemetryOutbox')
      .withIndex('by_event_id', (q) => q.eq('eventId', args.eventId))
      .unique()
    if (existing) {
      return null
    }
    await ctx.db.insert('telemetryOutbox', {
      eventId: args.eventId,
      name: args.name,
      properties: args.properties,
      createdAt: Date.now(),
      attempts: 0,
    })
    return null
  },
})

export const listUndelivered = internalQuery({
  args: { limit: v.number() },
  returns: v.array(
    v.object({
      _id: v.id('telemetryOutbox'),
      eventId: v.string(),
      name: v.string(),
      properties: v.record(v.string(), v.string()),
      attempts: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('telemetryOutbox')
      .withIndex('by_undelivered', (q) => q.eq('deliveredAt', undefined))
      .take(args.limit)
    return rows.map((row) => ({
      _id: row._id,
      eventId: row.eventId,
      name: row.name,
      properties: row.properties,
      attempts: row.attempts,
    }))
  },
})

export const markDelivered = internalMutation({
  args: { id: v.id('telemetryOutbox') },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { deliveredAt: Date.now() })
    return null
  },
})

export const markAttemptFailed = internalMutation({
  args: { id: v.id('telemetryOutbox'), error: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id)
    if (!row) return null
    await ctx.db.patch(args.id, {
      attempts: row.attempts + 1,
      lastError: args.error.slice(0, 500),
    })
    return null
  },
})

export const getOutboxStats = query({
  args: {},
  returns: v.object({
    undeliveredSample: v.number(),
  }),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query('telemetryOutbox')
      .withIndex('by_undelivered', (q) => q.eq('deliveredAt', undefined))
      .take(50)
    return { undeliveredSample: rows.length }
  },
})
