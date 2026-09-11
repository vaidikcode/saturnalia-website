'use client'

import { useSyncExternalStore } from 'react'
import posthog from 'posthog-js'
import { type ClientEventName, isClientEvent } from './analytics/events'
import { sanitizeErrorMessage, sanitizeUrl } from './telemetry-sanitize'

export { sanitizeErrorMessage, sanitizeUrl } from './telemetry-sanitize'

export const TELEMETRY_FLAGS = {
  analyticsEnabled: 'analytics-enabled',
  errorTrackingEnabled: 'error-tracking-enabled',
  siteLaunched: 'site-launched',
} as const

type TelemetryFlag = (typeof TELEMETRY_FLAGS)[keyof typeof TELEMETRY_FLAGS]
type LaunchPhase = 'pre_launch' | 'live'
type TelemetryState = {
  flagsLoaded: boolean
  analyticsEnabled: boolean
  errorTrackingEnabled: boolean
  launchPhase: LaunchPhase
}

const initialState: TelemetryState = {
  flagsLoaded: false,
  analyticsEnabled: false,
  errorTrackingEnabled: false,
  launchPhase: 'pre_launch',
}

let state = initialState
let initialized = false
let lastPageview: string | undefined
const listeners = new Set<() => void>()
const errorFingerprints = new Map<string, number>()

function notify(): void {
  listeners.forEach((listener) => listener())
}

function updateState(next: Partial<TelemetryState>): void {
  state = { ...state, ...next }
  notify()
}

function readEnv(name: string): string | undefined {
  if (typeof process === 'undefined') return undefined
  return process.env[name]
}

export function getDeploymentEnvironment(): 'development' | 'preview' | 'production' {
  const value = readEnv('NEXT_PUBLIC_SAT_DEPLOYMENT_ENV')
  if (value === 'production') return 'production'
  if (value === 'preview') return 'preview'
  return 'development'
}

export function getRelease(): string {
  return readEnv('NEXT_PUBLIC_SAT_RELEASE') ?? 'local'
}

function baseProperties(): Record<string, string> {
  return {
    launch_phase: state.launchPhase,
    environment: getDeploymentEnvironment(),
    release: getRelease(),
  }
}

function isBrowserExtensionError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error)
  return /^(chrome|moz|safari)-extension:\/\//i.test(message) || /extension context invalidated/i.test(message)
}

function shouldCaptureError(error: unknown): boolean {
  if (!state.flagsLoaded || !state.errorTrackingEnabled || isBrowserExtensionError(error)) return false
  const fingerprint = sanitizeErrorMessage(error)
  const now = Date.now()
  const lastCaptured = errorFingerprints.get(fingerprint)
  if (lastCaptured && now - lastCaptured < 10_000) return false
  errorFingerprints.set(fingerprint, now)
  return true
}

function capturePageview(): void {
  if (typeof window === 'undefined') return
  const path = sanitizeUrl(window.location.href)
  if (!state.analyticsEnabled || lastPageview === path) return
  lastPageview = path
  posthog.capture('$pageview', { ...baseProperties(), $current_url: path })
}

function readFlags(): void {
  updateState({
    flagsLoaded: true,
    analyticsEnabled: posthog.isFeatureEnabled(TELEMETRY_FLAGS.analyticsEnabled) === true,
    errorTrackingEnabled: posthog.isFeatureEnabled(TELEMETRY_FLAGS.errorTrackingEnabled) === true,
    launchPhase: posthog.isFeatureEnabled(TELEMETRY_FLAGS.siteLaunched) === true ? 'live' : 'pre_launch',
  })
  capturePageview()
}

export function initializeTelemetry(): void {
  const projectKey = readEnv('NEXT_PUBLIC_POSTHOG_KEY')
  if (initialized || !projectKey || getDeploymentEnvironment() === 'development') return
  if (typeof window === 'undefined') return
  initialized = true
  posthog.init(projectKey, {
    api_host: readEnv('NEXT_PUBLIC_POSTHOG_HOST') ?? 'https://us.i.posthog.com',
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_dead_clicks: false,
    capture_exceptions: false,
    capture_heatmaps: false,
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    enable_recording_console_log: false,
    persistence: 'localStorage+cookie',
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

export function track(event: ClientEventName, properties: Record<string, string> = {}): void {
  if (!isClientEvent(event)) return
  if (state.flagsLoaded && state.analyticsEnabled) {
    posthog.capture(event, { ...baseProperties(), ...properties })
  }
}

export function captureError(error: unknown, properties: Record<string, string> = {}): void {
  if (shouldCaptureError(error)) {
    posthog.captureException(error, {
      ...baseProperties(),
      ...properties,
      error_message: sanitizeErrorMessage(error),
    })
  }
}

/** Safe identify after Clerk sign-in. Never pass emails or PII beyond the stable clerk subject. */
export function identifyUser(clerkUserId: string): void {
  if (!initialized || !state.analyticsEnabled || !clerkUserId) return
  posthog.identify(clerkUserId, { environment: getDeploymentEnvironment() })
  track('auth_signed_in')
}

/** Reset distinct id on sign-out. */
export function resetUser(): void {
  if (!initialized) return
  if (state.analyticsEnabled) track('auth_signed_out')
  posthog.reset()
}

export function useTelemetryFlag(flag: TelemetryFlag): boolean | undefined {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => {
      if (!state.flagsLoaded) return undefined
      if (flag === TELEMETRY_FLAGS.analyticsEnabled) return state.analyticsEnabled
      if (flag === TELEMETRY_FLAGS.errorTrackingEnabled) return state.errorTrackingEnabled
      return state.launchPhase === 'live'
    },
    () => undefined,
  )
}

export function getTelemetryState(): TelemetryState {
  return state
}
