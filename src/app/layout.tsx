import type { Metadata } from 'next'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { TelemetryProvider } from '@/components/TelemetryProvider'
import { Providers } from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Saturnalia',
  description: 'Saturnalia — Thapar Institute of Engineering and Technology cultural festival.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <TelemetryProvider>
            <ErrorBoundary>{children}</ErrorBoundary>
          </TelemetryProvider>
        </Providers>
      </body>
    </html>
  )
}
