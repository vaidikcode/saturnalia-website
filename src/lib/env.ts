export function isConfiguredClerkPublishableKey(key: string | undefined): key is string {
  if (!key) return false
  if (key.includes('placeholder')) return false
  return /^pk_(test|live)_[A-Za-z0-9]{20,}$/.test(key)
}

export function isConfiguredConvexUrl(url: string | undefined): url is string {
  return Boolean(url && !url.includes('example.convex.cloud'))
}
