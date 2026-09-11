# Agent instructions — Saturnalia website

This repository is the Next.js website + shared Convex backend for Saturnalia.

## Skills (read when relevant)

- [Frontend changes](.cursor/skills/frontend-changes/SKILL.md) — App Router, client analytics, UI
- [Backend changes](.cursor/skills/backend-changes/SKILL.md) — Convex schema, auth, outbox telemetry

## Stack

- Next.js App Router, TypeScript, Bun
- Convex (this repo owns production backend source)
- Clerk (identity); application profiles live in Convex
- PostHog (client flags + optional server outbox flush)

## Hard constraints

- Do **not** use Convex/Clerk MCP plugins or CLI logins against mismatched accounts unless the operator asks.
- Dashboard setup is manual — see [docs/dashboard-setup.md](docs/dashboard-setup.md).
- Feature modules (#6+) wait until foundation P0s (#1–#5) and the merge-to-prod pipeline work.

## Analytics

Event catalog: [docs/analytics/events.md](docs/analytics/events.md)  
Typed names: [src/lib/analytics/events.ts](src/lib/analytics/events.ts)
