import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  profiles: defineTable({
    clerkSubject: v.string(),
    email: v.string(),
    name: v.string(),
    onboardingComplete: v.boolean(),
    role: v.union(v.literal('attendee'), v.literal('staff'), v.literal('admin')),
    legacyFirebaseUid: v.optional(v.string()),
    deactivatedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_clerk_subject', ['clerkSubject'])
    .index('by_email', ['email'])
    .index('by_role', ['role']),

  festivalConfig: defineTable({
    key: v.literal('singleton'),
    festivalName: v.string(),
    launchAnnounced: v.boolean(),
    updatedAt: v.number(),
    updatedByProfileId: v.optional(v.id('profiles')),
  }).index('by_key', ['key']),

  telemetryOutbox: defineTable({
    eventId: v.string(),
    name: v.string(),
    properties: v.record(v.string(), v.string()),
    createdAt: v.number(),
    attempts: v.number(),
    deliveredAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
  })
    .index('by_event_id', ['eventId'])
    .index('by_undelivered', ['deliveredAt', 'createdAt']),
})
