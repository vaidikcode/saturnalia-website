import { describe, expect, it } from 'vitest'
import { ALL_ANALYTICS_EVENTS, CLIENT_EVENTS, isClientEvent } from './analytics/events'
import { sanitizeErrorMessage, sanitizeUrl } from './telemetry-sanitize'

describe('telemetry sanitization', () => {
  it('removes query strings while retaining the path and fragment', () => {
    expect(sanitizeUrl('https://saturnalia.example/events?email=test@example.com#headline')).toBe('/events#headline')
  })

  it('removes URLs and query parameters from error messages', () => {
    expect(sanitizeErrorMessage(new Error('Request https://example.com/path?token=secret failed'))).toBe(
      'Request [url] failed',
    )
  })
})

describe('analytics event catalog', () => {
  it('includes existing client interaction events', () => {
    expect(CLIENT_EVENTS).toContain('navigation_clicked')
    expect(CLIENT_EVENTS).toContain('hero_begin_clicked')
    expect(isClientEvent('hero_video_started')).toBe(true)
    expect(isClientEvent('not_a_real_event')).toBe(false)
  })

  it('keeps a non-empty catalog for mechanical CI checks', () => {
    expect(ALL_ANALYTICS_EVENTS.length).toBeGreaterThan(0)
    expect(new Set(ALL_ANALYTICS_EVENTS).size).toBe(ALL_ANALYTICS_EVENTS.length)
  })
})
