'use node'

import { v } from 'convex/values'
import { internal } from './_generated/api'
import { internalAction } from './_generated/server'

type OutboxRow = {
  _id: string
  eventId: string
  name: string
  properties: Record<string, string>
  attempts: number
}

function buildCapturePayload(apiKey: string, row: OutboxRow): Record<string, unknown> {
  const distinctId = row.properties.distinct_id ?? 'convex_server'
  const baseProperties: Record<string, unknown> = {
    ...row.properties,
    $insert_id: row.eventId,
    source: row.properties.source ?? 'convex_outbox',
  }

  if (row.name === 'backend_exception') {
    return {
      api_key: apiKey,
      event: '$exception',
      distinct_id: distinctId,
      properties: {
        ...baseProperties,
        $exception_list: [
          {
            type: row.properties.exception_type ?? 'Error',
            value: row.properties.exception_message ?? 'Unknown backend error',
            mechanism: { handled: true, synthetic: false },
          },
        ],
        $exception_fingerprint: row.properties.exception_fingerprint,
        $exception_level: 'error',
        source: 'convex_backend',
      },
      timestamp: new Date().toISOString(),
    }
  }

  return {
    api_key: apiKey,
    event: row.name,
    distinct_id: distinctId,
    properties: baseProperties,
    timestamp: new Date().toISOString(),
  }
}

async function captureExceptionDirect(
  apiKey: string,
  host: string,
  args: {
    distinctId: string
    type: string
    message: string
    fingerprint: string
    source: string
    insertId: string
  },
): Promise<void> {
  const response = await fetch(`${host.replace(/\/$/, '')}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      event: '$exception',
      distinct_id: args.distinctId,
      properties: {
        $exception_list: [
          {
            type: args.type,
            value: args.message,
            mechanism: { handled: true, synthetic: false },
          },
        ],
        $exception_fingerprint: args.fingerprint,
        $exception_level: 'error',
        source: args.source,
        $insert_id: args.insertId,
      },
      timestamp: new Date().toISOString(),
    }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`PostHog exception capture ${response.status}: ${text.slice(0, 200)}`)
  }
}

/**
 * Flush undelivered outbox rows to PostHog Capture API.
 * Product events keep their names; `backend_exception` rows become `$exception`.
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
          body: JSON.stringify(buildCapturePayload(apiKey, row)),
        })
        if (!response.ok) {
          const text = await response.text()
          throw new Error(`PostHog ${response.status}: ${text.slice(0, 200)}`)
        }
        await ctx.runMutation(internal.telemetry.markDelivered, { id: row._id })
        delivered += 1
      } catch (error) {
        failed += 1
        const message = error instanceof Error ? error.message : 'unknown error'
        await ctx.runMutation(internal.telemetry.markAttemptFailed, {
          id: row._id,
          error: message,
        })
        // Report flush failures directly (avoid outbox recursion).
        try {
          await captureExceptionDirect(apiKey, host, {
            distinctId: 'convex_server',
            type: 'OutboxFlushError',
            message: message.slice(0, 500),
            fingerprint: `convex:telemetry.flushOutbox:${row.name}:${message.slice(0, 80)}`,
            source: 'telemetry.flushOutbox',
            insertId: `flush_fail:${row.eventId}:${row.attempts + 1}`,
          })
        } catch (reportError) {
          console.error('flush failure exception capture failed', reportError)
        }
      }
    }

    return { delivered, failed, skipped: false }
  },
})
