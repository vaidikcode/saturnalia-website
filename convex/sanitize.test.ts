import { describe, expect, it } from 'vitest'
import { exceptionTypeOf, sanitizeErrorMessage } from './lib/sanitize'

describe('convex sanitize', () => {
  it('strips urls, queries, and secret-looking tokens', () => {
    expect(
      sanitizeErrorMessage(
        new Error('fail https://x.test/a?token=abc with sk_live_abc123 and phc_xyz'),
      ),
    ).toBe('fail [url] with [secret] and [secret]')
  })

  it('reads Error.name for exception type', () => {
    const err = new TypeError('boom')
    expect(exceptionTypeOf(err)).toBe('TypeError')
    expect(exceptionTypeOf('plain')).toBe('Error')
  })
})
