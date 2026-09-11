'use client'

import { useEffect } from 'react'
import { initializeTelemetry } from '@/lib/telemetry'

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeTelemetry()
  }, [])

  return children
}
