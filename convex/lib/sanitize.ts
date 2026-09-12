/** Shared sanitization for Convex telemetry / error reporting. */

export function sanitizeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message
    .replace(/https?:\/\/[^\s)]+/g, '[url]')
    .replace(/[?&][^\s=&]+=[^\s&]+/g, '[query]')
    .replace(/\bsk_(?:live|test)_[A-Za-z0-9]+/g, '[secret]')
    .replace(/\bpk_(?:live|test)_[A-Za-z0-9]+/g, '[secret]')
    .replace(/\bwhsec_[A-Za-z0-9]+/g, '[secret]')
    .replace(/\bphc_[A-Za-z0-9]+/g, '[secret]')
    .replace(/\bphx_[A-Za-z0-9]+/g, '[secret]')
    .slice(0, 500)
}

export function exceptionTypeOf(error: unknown): string {
  if (error instanceof Error && error.name) {
    return error.name.slice(0, 100)
  }
  return 'Error'
}
