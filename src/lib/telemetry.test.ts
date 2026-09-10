import { describe, expect, it } from 'vitest'
import { sanitizeErrorMessage, sanitizeUrl } from './telemetry'

describe('telemetry sanitization', () => {
  it('removes query strings while retaining the path and fragment', () => { expect(sanitizeUrl('https://saturnalia.example/events?email=test@example.com#headline')).toBe('/events#headline') })
  it('removes URLs and query parameters from error messages', () => { expect(sanitizeErrorMessage(new Error('Request https://example.com/path?token=secret failed'))).toBe('Request [url] failed') })
})
