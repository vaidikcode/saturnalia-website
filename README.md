# Saturnalia website

Next.js App Router + Bun + Convex + Clerk. This repo owns the website and the shared Convex backend.

## Setup (read this first)

**Full step-by-step (local → reclaim `keel.my` on a new Vercel project → production → CI/CD):**  
**[docs/dashboard-setup.md](docs/dashboard-setup.md)**

Do phases **in order**. `keel.my` currently points at a **deleted** Vercel project — Phase 3 recreates the Vercel project and rewrites Hostinger DNS. Do not create Clerk Production until that domain is Valid on the new project.

Short path after dashboards are linked:

```bash
bun install
# terminal A (Saturnalia Convex login)
bunx convex dev
# terminal B
bun run dev
```

Open http://localhost:3000.

## Scripts

| Command | Purpose |
|---------|---------|
| `bun run dev` | Next.js |
| `bun run lint` / `typecheck` / `test` / `build` | Quality gate |
| `bunx convex dev` | Sync backend (you run; your account) |
| `bun run export:api` | Refresh `contracts/convex-api.ts` for Expo |

## What the code already includes (P0 #1–#5)

- Next.js App Router landing page + Bun CI
- Analytics skills, event catalog, outbox contract
- Convex schema: profiles, festivalConfig, telemetryOutbox
- Clerk routes `/sign-in`, `/sign-up`, `/account` + webhook bridge
- GitHub Actions: Quality, Preview, Production (Convex then Vercel)

## Operator reminders

1. Local + Preview use Clerk **Development** (`pk_test_`).
2. Production uses Clerk **Production** on domain `https://keel.my` (or your real domain).
3. Disable Vercel **Production** Git auto-deploy so Actions owns promote.
4. Env names: see `.env.example` and the cheat sheet in `docs/dashboard-setup.md`.

## Caveats

- Convex + Vercel deploys are not one atomic transaction.
- Rolling back the frontend does not roll back Convex data.
- Prefer additive schema changes for mobile/web clients.
