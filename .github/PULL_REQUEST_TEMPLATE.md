## Summary

-

## Test plan

- [ ]

## Analytics

- [ ] Events documented in `docs/analytics/events.md` **or** `Events: none — <reason>`
- [ ] No sensitive properties (emails, tokens, QR, payments, raw forms)
- [ ] Backend changes use outbox (no PostHog fetch inside queries/mutations)

## Foundation checklists (when touching P0 surfaces)

- [ ] `bun run lint && bun run typecheck && bun run test && bun run build`
- [ ] Client/server boundaries respected for GSAP/Clerk/Convex
- [ ] Convex public functions have `args` + `returns` validators
