import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import posthog from '@posthog/rollup-plugin'

export default defineConfig(({ mode }) => {
  const deploymentEnvironment = process.env.VERCEL_ENV ?? (mode === 'production' ? 'production' : 'development')
  const release = process.env.VERCEL_GIT_COMMIT_SHA ?? 'local'
  const telemetryEnabled = Boolean(process.env.VITE_POSTHOG_KEY)
  const uploadSourceMaps = Boolean(process.env.VERCEL) && telemetryEnabled
  if (uploadSourceMaps && (!process.env.POSTHOG_API_KEY || !process.env.POSTHOG_PROJECT_ID)) throw new Error('POSTHOG_API_KEY and POSTHOG_PROJECT_ID are required for Vercel builds with VITE_POSTHOG_KEY.')
  return { define: { __SAT_DEPLOYMENT_ENV__: JSON.stringify(deploymentEnvironment), __SAT_RELEASE__: JSON.stringify(release) }, build: { sourcemap: uploadSourceMaps ? 'hidden' : false }, plugins: [react(), tailwindcss(), ...(uploadSourceMaps ? [posthog({ personalApiKey: process.env.POSTHOG_API_KEY!, projectId: process.env.POSTHOG_PROJECT_ID!, host: process.env.POSTHOG_HOST, sourcemaps: { enabled: true, releaseName: 'saturnalia-website', releaseVersion: release, deleteAfterUpload: true } })] : [])] }
})
