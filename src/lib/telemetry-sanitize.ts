export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url, typeof window === 'undefined' ? 'https://saturnalia.invalid' : window.location.origin)
    return `${parsed.pathname}${parsed.hash}`
  } catch {
    return '/'
  }
}

export function sanitizeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message
    .replace(/https?:\/\/[^\s)]+/g, '[url]')
    .replace(/[?&][^\s=&]+=[^\s&]+/g, '[query]')
    .slice(0, 500)
}
