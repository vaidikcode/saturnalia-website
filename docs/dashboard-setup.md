# End-to-end setup (local + production + CI/CD)

Do this on the **Saturnalia** GitHub / Vercel / Convex / Clerk accounts.  
Do **not** use Cursor Convex or Clerk plugins if they are logged into a different email.

**Your production domain (from Hostinger):** `keel.my`  
Use `https://keel.my` everywhere below unless you later change domains.

Work **in order**. Do not jump ahead to webhooks or production Clerk before the earlier step exists.

```text
0 Accounts + understand keel.my (old/deleted Vercel)
1 Local: Convex + Clerk Development + .env.local
2 GitHub: push + Quality checks
3 Vercel: NEW project, reclaim keel.my, fix Hostinger DNS
4 Clerk Production (only after keel.my is Valid on the new project)
5 Convex Production + env vars
6 CI/CD secrets + disable Vercel Git prod deploys
7 PostHog (optional until launch)
8 Final verification
```

---

## Phase 0 — Accounts and domain reality check

### 0.1 Accounts

Create / log into (same human owner as Saturnalia):

| Service | URL |
|---------|-----|
| GitHub | https://github.com/vaidikcode/saturnalia-website |
| Vercel | https://vercel.com |
| Convex | https://dashboard.convex.dev |
| Clerk | https://dashboard.clerk.com |
| PostHog | https://us.posthog.com (or your host) |

### 0.2 About `keel.my` (important)

`keel.my` is **your** domain at Hostinger. The DNS records you have today (A `@` → `216.198.79.1`, CNAME `www` → `….vercel-dns-017.com`) point at **an old Vercel project that was deleted**.

That means:

- Those DNS values are **stale**. Do **not** treat them as final.
- `https://keel.my` may fail, show the wrong site, or hang until you reclaim the domain.
- You will create a **new** Vercel project for this Saturnalia repo in Phase 3, then **replace** Hostinger DNS with whatever that **new** project shows.

Until Phase 3 is done:

- Use `http://localhost:3000` for all testing.
- Do **not** create Clerk Production yet (it needs a working `https://keel.my` on the new deployment).

---


## Phase 1 — Local stack only (Development)

Goal: site runs on `http://localhost:3000` with sign-in working.  
No production Clerk. No CI secrets yet.

### 1.1 Create Convex project (Development)

1. Open https://dashboard.convex.dev → **Create project** (name e.g. `saturnalia`).
2. Leave it on the **Development** deployment for now.
3. In this repo:

```bash
bun install
bunx convex dev
```

4. Log in with the Saturnalia Convex account, select the project.
5. This writes `NEXT_PUBLIC_CONVEX_URL` into `.env.local` and refreshes `convex/_generated/`.

**Stop here for Convex env vars that mention Clerk** — Clerk does not exist yet. Leave those blank until step 1.3.

### 1.2 Create Clerk application (Development — Account Portal)

We use **Clerk Account Portal** (hosted sign-in on `*.accounts.dev`). Leave Paths on “Account Portal” — do **not** switch to `/sign-in` on localhost.

1. Open https://dashboard.clerk.com → **Create application**.
2. Stay on the **Development** instance (`pk_test_…` / `sk_test_…`).
3. Do **not** click “Create production instance” yet.
4. API Keys → copy:
   - Publishable key → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Secret key → `CLERK_SECRET_KEY`
5. Paths: leave **Sign-in / Sign-up / Sign-out on Account Portal** (your current settings are correct).
6. Allowed redirect URLs (Development) — add at least:
   - `http://localhost:3000`
   - `http://localhost:3000/account`
   (Clerk may also allow `http://localhost:3000/*` depending on UI.)

### 1.3 Connect Clerk Development → Convex Development

1. In Clerk: enable the **Convex** integration (Integrations / Convex).
2. Confirm a JWT template named **`convex`** exists (integration creates it).
3. Copy Clerk **Frontend API URL** for Development  
   (looks like `https://verb-noun-00.clerk.accounts.dev`).
4. Convex Dashboard → **Development** deployment → Settings → Environment Variables:

| Convex env var | Value |
|----------------|--------|
| `CLERK_JWT_ISSUER_DOMAIN` | that Frontend API URL |
| `CLERK_CONVEX_WEBHOOK_BRIDGE_SECRET` | generate once: `openssl rand -hex 32` |

5. Re-run `bunx convex dev` so auth config syncs.

### 1.4 Finish local `.env.local`

Copy from `.env.example` if needed. Minimum for local:

```bash
# Clerk Development
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/account
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/account

# Convex Development (from `convex dev`)
NEXT_PUBLIC_CONVEX_URL=https://....convex.cloud

# Same random string as Convex
CLERK_CONVEX_WEBHOOK_BRIDGE_SECRET=...

# Webhook signing secret: fill later when you add a webhook (optional for pure local)
# CLERK_WEBHOOK_SIGNING_SECRET=

# PostHog: leave empty for silent local (correct)
# NEXT_PUBLIC_POSTHOG_KEY=
```

### 1.5 Run and verify locally

```bash
# terminal A
bunx convex dev

# terminal B
bun run dev
```

Checklist:

- [ ] http://localhost:3000 loads the landing page
- [ ] **Sign in** sends you to Clerk Account Portal (`*.accounts.dev`), then back to `/account`
- [ ] `/account` shows a Convex profile
- [ ] Sign out returns to `/`

Optional: after first successful login, copy your Clerk user id (`user_…`) into Convex Dev env `FIRST_ADMIN_SUBJECT`, restart `convex dev`, sign in again once → that user becomes the first admin.

**Local is done.** Production Clerk is still not required.

---

## Phase 2 — GitHub code + Quality CI

1. Push this branch / merge to `vaidikcode/saturnalia-website` (`main` when ready).
2. Confirm Actions run **Quality** (`.github/workflows/quality.yml`).
3. Repo Settings → Branches → protect `main`:
   - Require PR
   - Require check **Quality / lint-typecheck-test-build**
   - Require up-to-date branch

Quality can pass **without** production secrets (site builds in “setup” mode if keys are missing).

---

## Phase 3 — New Vercel project + reclaim `keel.my`

Do this **before** Clerk production. Clerk needs `https://keel.my` serving **this** app.

### 3.1 Create the new Vercel project

1. https://vercel.com/new → import **`vaidikcode/saturnalia-website`** (not the deleted project).
2. Framework preset: **Next.js**.
3. Install Command: `bun install` (or leave default if Bun is detected).
4. Deploy once so the project exists (landing page is enough; Clerk prod keys not required yet).

### 3.2 Clear the old / deleted project’s hold on the domain

If Vercel still thinks `keel.my` belongs to a deleted or other project:

1. Vercel → team Domains list (or the old project if it still appears).
2. Remove `keel.my` / `www.keel.my` from any **non-Saturnalia** project.
3. If the project is gone but the domain is “stuck”, use Vercel Domains → select domain → **Remove** / transfer to the new project when prompted.

You cannot attach one apex domain to two projects.

### 3.3 Attach the domain to the **new** Saturnalia project

1. New project → **Settings → Domains**.
2. Add:
   - `keel.my`
   - `www.keel.my` (redirect www → apex, or apex → www — pick one; Vercel can configure the redirect).
3. Vercel will show **exact** DNS records for **this** project. They may **differ** from the old Hostinger values.

### 3.4 Update Hostinger DNS to match the **new** project only

In Hostinger → `keel.my` → Manage DNS:

1. Edit or delete the old A / CNAME rows that pointed at the deleted deployment.
2. Add/replace with **exactly** what the new Vercel Domains page shows (common pattern, but **copy from Vercel**, don’t invent):

| Type | Name | Value |
|------|------|--------|
| A | `@` | IP(s) Vercel lists for the apex |
| CNAME | `www` | the `….vercel-dns-….com` target Vercel lists |

3. TTL: 300 is fine while testing.
4. Wait for DNS (minutes to a few hours).
5. In Vercel Domains, wait until status is **Valid**.
6. Open https://keel.my — you should see **this** Saturnalia deployment (or the latest Vercel deploy of this repo), not an old app.

If it still shows nothing / old site: flush DNS check with `dig keel.my` / `dig www.keel.my` and confirm Hostinger matches Vercel’s current instructions.

### 3.5 Critical CI/CD rule (do this on the new project now)

Vercel → Project → Settings → Git:

- **Disable automatic Production deployments from Git**  
  (or an Ignored Build Step that skips Production Git deploys).

Reason: GitHub Actions **Production** workflow must be the only promoter after Convex succeeds. If Vercel also deploys from `main`, you get races.

Preview Git deploys are optional; trusted PR previews can use `.github/workflows/preview.yml` later.

---

## Phase 4 — Clerk Production (only after `keel.my` is Valid on the **new** Vercel project)

1. Confirm https://keel.my loads the Saturnalia site from the **new** project.
2. Clerk Dashboard → your app → **Create production instance**.
3. Application domain: `https://keel.my`.
4. Complete any extra DNS CNAMEs Clerk asks for in Hostinger (follow Clerk’s exact records — separate from Vercel’s).
5. Production API Keys → copy `pk_live_…` and `sk_live_…`.
6. Keep **Account Portal** for sign-in/up (or Clerk’s production Account Portal domain). No need for app-hosted `/sign-in` UI.
7. Production allowed redirect URLs:
   - `https://keel.my`
   - `https://www.keel.my`
   - `https://keel.my/account`
8. Enable **Convex** integration on the **Production** instance too.
9. Copy Production Frontend API URL (use what Clerk shows).

### Webhooks (after https://keel.my is reachable)

1. Clerk Production → Webhooks → Add endpoint:  
   `https://keel.my/api/webhooks/clerk`
2. Events: `user.created`, `user.updated`, `user.deleted`
3. Copy signing secret → `CLERK_WEBHOOK_SIGNING_SECRET`

Development webhooks (optional). Not required for local profile create (client `ensureProfile` handles first login).

---

## Phase 5 — Convex Production

1. Convex Dashboard → create / open **Production** deployment for the same project.
2. Production → Settings → Environment Variables:

| Convex env var | Value |
|----------------|--------|
| `CLERK_JWT_ISSUER_DOMAIN` | **Production** Clerk Frontend API URL |
| `CLERK_CONVEX_WEBHOOK_BRIDGE_SECRET` | same bridge secret as local/Vercel (or a new prod-only secret, but then Next prod must match) |
| `FIRST_ADMIN_SUBJECT` | optional `user_…` from prod Clerk |
| `POSTHOG_API_KEY` / `POSTHOG_HOST` | optional outbox flush |

3. Project Settings → Deploy Keys:
   - **Production** deploy key → GitHub secret `CONVEX_DEPLOY_KEY_PRODUCTION`
   - **Preview** deploy key → GitHub secret `CONVEX_DEPLOY_KEY_PREVIEW`
4. Copy Production deployment URL → `NEXT_PUBLIC_CONVEX_URL` for prod (Vercel + GitHub).

First production function deploy can wait for the GitHub Production workflow (Phase 6), or run once:

```bash
CONVEX_DEPLOY_KEY=... bunx convex deploy
```

---

## Phase 6 — Env vars by environment (cheat sheet)

### A) Local `.env.local` (Development)

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk **Dev** `pk_test_` |
| `CLERK_SECRET_KEY` | Clerk **Dev** `sk_test_` |
| `NEXT_PUBLIC_CONVEX_URL` | `bunx convex dev` |
| `CLERK_CONVEX_WEBHOOK_BRIDGE_SECRET` | your generated secret |
| `CLERK_WEBHOOK_SIGNING_SECRET` | optional locally |
| `NEXT_PUBLIC_POSTHOG_*` | leave empty (silent local) |

### B) Vercel Preview + GitHub Preview secrets

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `_PREVIEW` | Clerk **Dev** test keys |
| `CLERK_SECRET_KEY` / `_PREVIEW` | Clerk **Dev** |
| `CLERK_CONVEX_WEBHOOK_BRIDGE_SECRET` | same bridge |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Dev webhook if you add one |
| `CONVEX_DEPLOY_KEY_PREVIEW` | Convex Preview deploy key |
| PostHog public + private keys | if you want preview telemetry |

### C) Vercel Production + GitHub Production secrets

| Variable / secret | Source |
|-------------------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk **Prod** `pk_live_` |
| `CLERK_SECRET_KEY` | Clerk **Prod** `sk_live_` |
| `NEXT_PUBLIC_CONVEX_URL` | Convex **Production** URL |
| `CLERK_CONVEX_WEBHOOK_BRIDGE_SECRET` | must match Convex Prod |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Clerk Prod webhook |
| `CONVEX_DEPLOY_KEY_PRODUCTION` | Convex Prod deploy key |
| `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | Vercel account → tokens / project settings |
| `PRODUCTION_URL` | `https://keel.my` |
| `POSTHOG_*` | if enabling analytics / source maps |

Generate Vercel token: https://vercel.com/account/tokens  
Org + Project IDs: Project → Settings → General.

---

## Phase 7 — Wire CI/CD end-to-end

### 7.1 GitHub Actions secrets

Repo → Settings → Secrets and variables → Actions → add every row in Phase 6 B/C that you use.

Minimum for a first production promote:

- `CONVEX_DEPLOY_KEY_PRODUCTION`
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `PRODUCTION_URL` = `https://keel.my`

### 7.2 GitHub Environment

Settings → Environments → create `production` (optional required reviewers).

### 7.3 How deploys work after this

| Event | What runs |
|-------|-----------|
| Pull request | **Quality** (always). **Preview** Convex if preview deploy key set |
| Merge / push to `main` | **Production** workflow: Convex prod deploy → build Next → Vercel promote → smoke `https://keel.my` |

Do **not** cancel a production run mid Convex schema update.

Convex + Vercel are not atomic: if Convex succeeds and Vercel fails, data may already be new while the old frontend remains. Frontend rollback does not roll back Convex data.

---

## Phase 8 — PostHog (can wait)

1. Create project keys.
2. Flags (boolean):
   - `analytics-enabled`
   - `error-tracking-enabled`
   - `site-launched` (keep off until public launch)
3. Set `NEXT_PUBLIC_POSTHOG_KEY` / `HOST` on Vercel Preview + Production only.
4. If those are set on Vercel, also set `POSTHOG_API_KEY` + `POSTHOG_PROJECT_ID` for source maps.
5. Optional: same `POSTHOG_API_KEY` on Convex for outbox flush.

Local stays silent without the public key (intentional).

---

## Phase 9 — Final verification

### Local

```bash
bunx convex dev
bun run dev
bun run lint && bun run typecheck && bun run test && bun run build
```

- [ ] Landing + sign-in + account profile
- [ ] Admin bootstrap if you set `FIRST_ADMIN_SUBJECT`

### Production

- [ ] https://keel.my loads
- [ ] https://keel.my/sign-in uses **live** Clerk
- [ ] Account profile appears (Convex Production)
- [ ] Webhook delivers (Clerk webhook dashboard shows successes)
- [ ] Merge a tiny PR: Quality passes → Production workflow deploys Convex then Vercel
- [ ] Vercel does **not** also auto-deploy Production from Git on its own

---

## What you cannot do from this repo alone

| Task | Owner |
|------|--------|
| Buy/DNS `keel.my`, create cloud projects | You |
| Paste secrets into dashboards / GitHub | You |
| Disable Vercel Production Git auto-deploy | You |
| Create Clerk Production instance with domain | You |
| Require GitHub status checks | You (repo admin) |

---

## Quick “where am I stuck?” map

| Symptom | Likely cause |
|---------|----------------|
| `/sign-in` says Clerk not configured | Missing/invalid `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env.local` |
| Signed in but no profile | Convex URL missing, or `CLERK_JWT_ISSUER_DOMAIN` wrong / not synced |
| `keel.my` broken / old site / won’t verify | DNS still points at **deleted** Vercel project — Phase 3: new project, remove domain from old, rewrite Hostinger from **new** Vercel Domains page |
| Clerk asks for domain to create prod | Normal — finish Phase 3 (`keel.my` **Valid** on new Vercel) then Phase 4 |
| Domain “already in use” on Vercel | Still attached to old/deleted project — Phase 3.2 |
| Two production deploys racing | Vercel Git Production still enabled — Phase 3.5 |
| Preview backend empty | Missing `CONVEX_DEPLOY_KEY_PREVIEW` or Preview workflow skipped |
