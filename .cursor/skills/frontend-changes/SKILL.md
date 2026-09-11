---
name: frontend-changes
description: >-
  Conventions for Saturnalia website frontend changes: App Router client
  boundaries, PostHog analytics events, sanitization, and feature checklists.
  Use when editing src/app, src/components, or client telemetry.
---

# Frontend changes

## Triggers

- Editing React components, App Router pages, styles, or client analytics
- Adding navigation, forms, auth UI, or interactive landing sections

## Rules

1. Prefer Server Components; mark browser-only work (`"use client"`) for GSAP, Lenis, video, Clerk hooks, Convex hooks.
2. Track meaningful interactions with `track()` from `@/lib/telemetry` using names from `src/lib/analytics/events.ts`.
3. Never capture raw form values, tokens, QR payloads, payment details, or emails in analytics properties.
4. Pageviews are owned by telemetry init — do not fire duplicate `$pageview` events.
5. Call `identifyUser(clerkUserId)` / `resetUser()` only via `AuthAnalyticsBridge` (or equivalent auth lifecycle), not from business-success mutations.
6. Local `development` stays silent. Preview/production honor PostHog flags `analytics-enabled`, `error-tracking-enabled`, `site-launched`.
7. Errors go through `captureError` / `ErrorBoundary`. Analytics outages must not break UX.
8. If a change has no analytics impact, note `Events: none — <reason>` in the PR.

## Checklist

- [ ] Client boundaries correct (`"use client"` only where needed)
- [ ] New events added to `src/lib/analytics/events.ts` + `docs/analytics/events.md`
- [ ] No sensitive properties in `track()` calls
- [ ] Reduced-motion / a11y considered for animation work
- [ ] Verified in browser for touched routes
