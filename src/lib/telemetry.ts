import { useSyncExternalStore } from 'react'
import posthog from 'posthog-js'

export const TELEMETRY_FLAGS = { analyticsEnabled: 'analytics-enabled', errorTrackingEnabled: 'error-tracking-enabled', siteLaunched: 'site-launched' } as const
type TelemetryFlag = (typeof TELEMETRY_FLAGS)[keyof typeof TELEMETRY_FLAGS]
type LaunchPhase = 'pre_launch' | 'live'
type TelemetryState = { flagsLoaded: boolean; analyticsEnabled: boolean; errorTrackingEnabled: boolean; launchPhase: LaunchPhase }

declare const __SAT_DEPLOYMENT_ENV__: string
declare const __SAT_RELEASE__: string

const initialState: TelemetryState = { flagsLoaded: false, analyticsEnabled: false, errorTrackingEnabled: false, launchPhase: 'pre_launch' }
let state = initialState
let initialized = false
let lastPageview: string | undefined
const listeners = new Set<() => void>()
const errorFingerprints = new Map<string, number>()

function notify(): void { listeners.forEach((listener) => listener()) }
function updateState(next: Partial<TelemetryState>): void { state = { ...state, ...next }; notify() }

export function getDeploymentEnvironment(): 'development' | 'preview' | 'production' {
  if (__SAT_DEPLOYMENT_ENV__ === 'production') return 'production'
  if (__SAT_DEPLOYMENT_ENV__ === 'preview') return 'preview'
  return 'development'
}

export function sanitizeUrl(url: string): string {
  try { const parsed = new URL(url, typeof window === 'undefined' ? 'https://saturnalia.invalid' : window.location.origin); return `${parsed.pathname}${parsed.hash}` } catch { return '/' }
}

export function sanitizeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/https?:\/\/[^\s)]+/g, '[url]').replace(/[?&][^\s=&]+=[^\s&]+/g, '[query]').slice(0, 500)
}

function baseProperties(): Record<string, string> { return { launch_phase: state.launchPhase, environment: getDeploymentEnvironment(), release: __SAT_RELEASE__ } }
function isBrowserExtensionError(error: unknown): boolean { const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error); return /^(chrome|moz|safari)-extension:\/\//i.test(message) || /extension context invalidated/i.test(message) }
function shouldCaptureError(error: unknown): boolean {
  if (!state.flagsLoaded || !state.errorTrackingEnabled || isBrowserExtensionError(error)) return false
  const fingerprint = sanitizeErrorMessage(error); const now = Date.now(); const lastCaptured = errorFingerprints.get(fingerprint)
  if (lastCaptured && now - lastCaptured < 10_000) return false
  errorFingerprints.set(fingerprint, now); return true
}
function capturePageview(): void {
  const path = sanitizeUrl(window.location.href)
  if (!state.analyticsEnabled || lastPageview === path) return
  lastPageview = path; posthog.capture('$pageview', { ...baseProperties(), $current_url: path })
}
function readFlags(): void {
  updateState({ flagsLoaded: true, analyticsEnabled: posthog.isFeatureEnabled(TELEMETRY_FLAGS.analyticsEnabled) === true, errorTrackingEnabled: posthog.isFeatureEnabled(TELEMETRY_FLAGS.errorTrackingEnabled) === true, launchPhase: posthog.isFeatureEnabled(TELEMETRY_FLAGS.siteLaunched) === true ? 'live' : 'pre_launch' })
  capturePageview()
}

export function initializeTelemetry(): void {
  const projectKey = import.meta.env.VITE_POSTHOG_KEY
  if (initialized || !projectKey || getDeploymentEnvironment() === 'development') return
  initialized = true
  posthog.init(projectKey, {
    api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com', autocapture: false, capture_pageview: false, capture_pageleave: false, capture_dead_clicks: false, capture_exceptions: false, capture_heatmaps: false, capture_performance: false, disable_session_recording: true, disable_surveys: true, enable_recording_console_log: false, persistence: 'localStorage+cookie',
    before_send: (event) => {
      if (!event) return null
      Object.assign(event.properties, baseProperties())
      event.properties.$current_url = sanitizeUrl(String(event.properties.$current_url ?? window.location.href))
      event.properties.$referrer = sanitizeUrl(String(event.properties.$referrer ?? ''))
      return event
    },
  })
  posthog.onFeatureFlags(readFlags)
  window.addEventListener('focus', () => posthog.reloadFeatureFlags())
  window.setInterval(() => posthog.reloadFeatureFlags(), 300_000)
  window.addEventListener('error', (event) => captureError(event.error ?? event.message))
  window.addEventListener('unhandledrejection', (event) => captureError(event.reason))
}

export function track(event: 'navigation_clicked' | 'hero_begin_clicked' | 'hero_video_started' | 'hero_video_completed', properties: Record<string, string> = {}): void { if (state.flagsLoaded && state.analyticsEnabled) posthog.capture(event, { ...baseProperties(), ...properties }) }
export function captureError(error: unknown, properties: Record<string, string> = {}): void { if (shouldCaptureError(error)) posthog.captureException(error, { ...baseProperties(), ...properties, error_message: sanitizeErrorMessage(error) }) }
export function useTelemetryFlag(flag: TelemetryFlag): boolean | undefined {
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener) }, () => {
    if (!state.flagsLoaded) return undefined
    if (flag === TELEMETRY_FLAGS.analyticsEnabled) return state.analyticsEnabled
    if (flag === TELEMETRY_FLAGS.errorTrackingEnabled) return state.errorTrackingEnabled
    return state.launchPhase === 'live'
  }, () => undefined)
}
export function getTelemetryState(): TelemetryState { return state }
