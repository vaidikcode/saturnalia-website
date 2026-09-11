import type { NextConfig } from 'next'

const deploymentEnvironment = process.env.VERCEL_ENV ?? (process.env.NODE_ENV === 'production' ? 'production' : 'development')
const release = process.env.VERCEL_GIT_COMMIT_SHA ?? 'local'
const telemetryEnabled = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY)
const uploadSourceMaps = process.env.VERCEL === '1' && telemetryEnabled

if (uploadSourceMaps && (!process.env.POSTHOG_API_KEY || !process.env.POSTHOG_PROJECT_ID)) {
  throw new Error('POSTHOG_API_KEY and POSTHOG_PROJECT_ID are required for Vercel builds with NEXT_PUBLIC_POSTHOG_KEY.')
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SAT_DEPLOYMENT_ENV: deploymentEnvironment,
    NEXT_PUBLIC_SAT_RELEASE: release,
  },
  productionBrowserSourceMaps: uploadSourceMaps,
  webpack(config) {
    config.module.rules.push({
      test: /\.(mp4|webm)$/i,
      type: 'asset/resource',
    })
    return config
  },
  async headers() {
    if (!uploadSourceMaps) return []
    return [
      {
        source: '/:path*.map',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
    ]
  },
}

export default nextConfig
