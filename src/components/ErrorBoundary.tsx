'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { captureError } from '@/lib/telemetry'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureError(error, { component_stack: info.componentStack?.slice(0, 2_000) ?? '' })
  }

  render(): ReactNode {
    return this.state.hasError ? (
      <main role="alert">
        <h1>Something went wrong.</h1>
        <p>Please refresh the page and try again.</p>
      </main>
    ) : (
      this.props.children
    )
  }
}
