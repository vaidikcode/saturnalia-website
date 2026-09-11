---
name: backend-changes
description: >-
  Conventions for Saturnalia Convex backend: validators, indexes, auth helpers,
  telemetry outbox, and additive schema evolution. Use when editing convex/.
---

# Backend changes

## Triggers

- Editing `convex/**` schema, queries, mutations, actions, crons, or auth helpers

## Rules

1. Every public `query` / `mutation` / `action` defines `args` and `returns` validators.
2. Await all promises (`ctx.db.*`, `ctx.scheduler.*`).
3. Prefer indexes (`withIndex`) over `.filter()`. Paginate unbounded lists.
4. Deny-by-default auth via `convex/lib/auth.ts`. Never grant staff because of email domain.
5. **Never** call PostHog (or any network analytics) inside queries/mutations. Enqueue `telemetryOutbox` rows; `telemetryActions.flushOutbox` delivers with retry + `eventId` dedup.
6. Schedule only `internal.*` functions.
7. `"use node"` files may export actions only — no queries/mutations.
8. Schema changes are additive (expand → migrate → contract). Deploying schema is not a data migration.
9. Document new backend events in `docs/analytics/events.md` or note why none apply.
10. Keep Expo consumers compatible: regenerate `contracts/convex-api.ts` when public API changes.

## Checklist

- [ ] Validators on public functions
- [ ] Auth checks for user data
- [ ] Indexes for new query paths
- [ ] Outbox used for analytics (no network in mutations)
- [ ] Tests updated (`convex/**/*.test.ts`)
- [ ] Contract export considered for mobile
