/** Client and backend analytics event catalog. Keep in sync with docs/analytics/events.md */

export const CLIENT_EVENTS = [
  '$pageview',
  'navigation_clicked',
  'hero_begin_clicked',
  'hero_video_started',
  'hero_video_completed',
  'auth_signed_in',
  'auth_signed_out',
] as const

export const BACKEND_EVENTS = [
  'profile_ensured',
  'festival_config_updated',
] as const

export type ClientEventName = (typeof CLIENT_EVENTS)[number]
export type BackendEventName = (typeof BACKEND_EVENTS)[number]
export type AnalyticsEventName = ClientEventName | BackendEventName

export const ALL_ANALYTICS_EVENTS = [...CLIENT_EVENTS, ...BACKEND_EVENTS] as const

export function isClientEvent(name: string): name is ClientEventName {
  return (CLIENT_EVENTS as readonly string[]).includes(name)
}

export function isBackendEvent(name: string): name is BackendEventName {
  return (BACKEND_EVENTS as readonly string[]).includes(name)
}
