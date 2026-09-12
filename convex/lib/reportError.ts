import { internal } from '../_generated/api'
import type { MutationCtx } from '../_generated/server'
import type { BackendEventName } from './events'
import { exceptionTypeOf, sanitizeErrorMessage } from './sanitize'

async function insertOutboxRow(
  ctx: MutationCtx,
  args: {
    eventId: string
    name: BackendEventName
    properties: Record<string, string>
  },
): Promise<void> {
  const existing = await ctx.db
    .query('telemetryOutbox')
    .withIndex('by_event_id', (q) => q.eq('eventId', args.eventId))
    .unique()
  if (existing) return
  await ctx.db.insert('telemetryOutbox', {
    eventId: args.eventId,
    name: args.name,
    properties: args.properties,
    createdAt: Date.now(),
    attempts: 0,
  })
}

/**
 * Enqueue a backend exception for PostHog Error Tracking via the outbox.
 * Never throws to callers — reporting failures only log.
 */
export async function reportBackendError(
  ctx: MutationCtx,
  args: {
    source: string
    error: unknown
    distinctId?: string
    extra?: Record<string, string>
  },
): Promise<void> {
  try {
    const exceptionMessage = sanitizeErrorMessage(args.error)
    const exceptionType = exceptionTypeOf(args.error)
    const fingerprint = `convex:${args.source}:${exceptionType}:${exceptionMessage.slice(0, 120)}`
    const eventId = `backend_exception:${fingerprint}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`

    const extra: Record<string, string> = {}
    for (const [key, value] of Object.entries(args.extra ?? {})) {
      extra[key.slice(0, 64)] = String(value).slice(0, 200)
    }

    await insertOutboxRow(ctx, {
      eventId,
      name: 'backend_exception',
      properties: {
        distinct_id: args.distinctId ?? 'convex_server',
        exception_type: exceptionType,
        exception_message: exceptionMessage,
        exception_fingerprint: fingerprint,
        source: args.source,
        ...extra,
      },
    })
    // Deliver promptly instead of waiting for the 5-minute cron.
    await ctx.scheduler.runAfter(0, internal.telemetryActions.flushOutbox, {})
  } catch (reportingError) {
    console.error('reportBackendError failed', reportingError)
  }
}
