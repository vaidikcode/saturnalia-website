# Saturnalia website

## Development

Use Node 22.14.0 and pnpm 10.33.0. Run `corepack enable`, then `pnpm install` and `pnpm dev`.

`pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` match the required GitHub Actions check: `lint-typecheck-test-build`.

## PostHog and Vercel

Copy `.env.example` to `.env.local` only when testing a fresh PostHog project. Development never initializes telemetry. Configure `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST` in Vercel Preview and Production.

Create these boolean PostHog feature flags before enabling public tracking: `analytics-enabled` (on), `error-tracking-enabled` (on), and `site-launched` (off). Until all flags return, telemetry is suppressed; `site-launched` controls event labeling only.

For any Vercel build that defines `VITE_POSTHOG_KEY`, also add server-side `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`, and optionally `POSTHOG_HOST`. The build uploads and deletes hidden source maps. Never use `VITE_` for a personal API key.

After the first successful CI run, a repository administrator should require the `Quality / lint-typecheck-test-build` check and require branches to be up to date before merge.
