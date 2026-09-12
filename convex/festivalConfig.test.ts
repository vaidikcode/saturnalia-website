import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { api, internal } from './_generated/api'
import schema from './schema'
import { modules } from './test.setup'

describe('festivalConfig vertical slice', () => {
  it('returns null when unset and seeds preview config', async () => {
    const t = convexTest(schema, modules)
    expect(await t.query(api.festivalConfig.getPublic, {})).toBeNull()
    const id = await t.mutation(api.festivalConfig.seedPreview, {})
    const config = await t.query(api.festivalConfig.getPublic, {})
    expect(config?._id).toEqual(id)
    expect(config?.festivalName).toBe('Saturnalia Preview')
    expect(config?.launchAnnounced).toBe(false)
  })
})

describe('telemetry outbox', () => {
  it('deduplicates by eventId and lists undelivered rows', async () => {
    const t = convexTest(schema, modules)
    await t.mutation(internal.telemetry.enqueue, {
      eventId: 'evt-1',
      name: 'profile_ensured',
      properties: { distinct_id: 'user_1' },
    })
    await t.mutation(internal.telemetry.enqueue, {
      eventId: 'evt-1',
      name: 'profile_ensured',
      properties: { distinct_id: 'user_1' },
    })
    const undelivered = await t.query(internal.telemetry.listUndelivered, { limit: 10 })
    expect(undelivered).toHaveLength(1)
    expect(undelivered[0]?.eventId).toBe('evt-1')
  })

  it('enqueues backend_exception probe rows', async () => {
    const t = convexTest(schema, modules)
    await t.mutation(internal.telemetry.enqueueTestException, { marker: 'ci' })
    const undelivered = await t.query(internal.telemetry.listUndelivered, { limit: 10 })
    expect(undelivered.some((row) => row.name === 'backend_exception')).toBe(true)
    const row = undelivered.find((row) => row.name === 'backend_exception')
    expect(row?.properties.exception_message).toContain('error-tracking probe')
    expect(row?.properties.probe).toBe('true')
  })
})
