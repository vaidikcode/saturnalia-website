# Analytics event catalog

Owner: website platform. Provider: PostHog.

Environment tags on every event: `environment` (`development` | `preview` | `production`), `release` (git SHA), `launch_phase` (`pre_launch` | `live`).

Local development never initializes the client SDK.

## Client events

| Event | When | Properties (safe) | Notes |
|-------|------|-------------------|-------|
| `$pageview` | After flags load / path change | `$current_url` (path+hash only) | Deduped per path |
| `navigation_clicked` | Nav link click | `target` | Coming-soon links use `*_coming_soon` |
| `hero_begin_clicked` | BEGIN button | — | |
| `hero_video_started` | Hero video play | — | |
| `hero_video_completed` | Hero video ended | — | |
| `auth_signed_in` | Clerk session becomes signed-in | — | Via `identifyUser`; distinct id = Clerk user id |
| `auth_signed_out` | Clerk session ends | — | Via `resetUser` |

**Never send:** emails, tokens, QR payloads, raw form fields, payment details.

## Backend events (outbox → PostHog)

Emitted only after successful DB commit via `telemetryOutbox` + scheduled flush.

| Event | When | Properties |
|-------|------|------------|
| `profile_ensured` | New profile insert | `profile_id`, `role`, `distinct_id` |
| `festival_config_updated` | Admin upsert | `festival_name`, `launch_announced`, `admin_profile_id` |
| `backend_exception` | Caught Convex failure sites | `exception_type`, `exception_message`, `exception_fingerprint`, `source`, `distinct_id` |

`backend_exception` rows are flushed as PostHog **`$exception`** events (Error Tracking), not as a custom event name. Messages are sanitized (URLs, query strings, common secret prefixes). Reporting must never fail the user-facing mutation.

Flush is a no-op without Convex env `POSTHOG_API_KEY` (use the **project** key `phc_…` for Capture). Optional `POSTHOG_HOST` (default `https://us.i.posthog.com`). Failures increment `attempts` and must not fail user mutations.

### Probe

Internal mutation `telemetry.enqueueTestException` enqueues a probe exception and schedules an immediate flush. Run from the Convex dashboard after `POSTHOG_API_KEY` is set.

## Feature PR rule

Every feature PR either lists events added/changed **or** states `Events: none — <reason>`.
