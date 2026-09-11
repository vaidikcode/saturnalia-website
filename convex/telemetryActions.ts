'use node'

import { v } from 'convex/values'
import { internal } from './_generated/api'
import { internalAction } from './_generated/server'

/**
 * Flush undelivered outbox rows to PostHog Capture API.
 * No-op when POSTHOG_API_KEY is unset. Failures increment attempts and never throw to callers.
 */
export const flushOutbox = internalAction({
  args: {},
  returns: v.object({ delivered: v.number(), failed: v.number(), skipped: v.boolean() }),
  handler: async (ctx) => {
    const apiKey = process.env.POSTHOG_API_KEY
    const host = process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com'
    if (!apiKey) {
      return { delivered: 0, failed: 0, skipped: true }
    }

    const rows = await ctx.runQuery(internal.telemetry.listUndelivered, { limit: 25 })
    let delivered = 0
    let failed = 0

    for (const row of rows) {
      try {
        const response = await fetch(`${host.replace(/\/$/, '')}/capture/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: apiKey,
            event: row.name,
            distinct_id: row.properties.distinct_id ?? 'server',
            properties: {
              ...row.properties,
              $insert_id: row.eventId,
              source: 'convex_outbox',
            },
            timestamp: new Date().toISOString(),
          }),
        })
        if (!response.ok) {
          const text = await response.text()
          throw new Error(`PostHog ${response.status}: ${text.slice(0, 200)}`)
        }
        await ctx.runMutation(internal.telemetry.markDelivered, { id: row._id })
        delivered += 1
      } catch (error) {
        failed += 1
        await ctx.runMutation(internal.telemetry.markAttemptFailed, {
          id: row._id,
          error: error instanceof Error ? error.message : 'unknown error',
        })
      }
    }

    return { delivered, failed, skipped: false }
  },
})
