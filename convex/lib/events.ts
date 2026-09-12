import { v } from 'convex/values'

export const BACKEND_EVENT_NAMES = [
  'profile_ensured',
  'festival_config_updated',
  'backend_exception',
] as const
export type BackendEventName = (typeof BACKEND_EVENT_NAMES)[number]

export const backendEventValidator = v.union(
  v.literal('profile_ensured'),
  v.literal('festival_config_updated'),
  v.literal('backend_exception'),
)
