'use client'

import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import logoAsset from '@/assets/ti-logo.png'
import { assetUrl } from '@/lib/asset'
import { track } from '@/lib/telemetry'
import './Navbar.css'

const PLACEHOLDER_LINKS = [
  { href: '#events', label: 'Events', target: 'events' },
  { href: '#team', label: 'Team', target: 'team' },
  { href: '#gallery', label: 'Gallery', target: 'gallery' },
  { href: '#contact', label: 'Contact', target: 'contact' },
] as const

function isConfiguredClerkKey(key: string | undefined): boolean {
  if (!key) return false
  if (key.includes('placeholder')) return false
  return /^pk_(test|live)_[A-Za-z0-9]{20,}$/.test(key)
}

const clerkEnabled = isConfiguredClerkKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

export default function Navbar() {
  const handleNavigation = (target: string) => track('navigation_clicked', { target })

  return (
    <nav className="floating-navbar" aria-label="Primary">
      <div className="navbar-logo">
        <img src={assetUrl(logoAsset)} alt="TI Logo" />
      </div>

      <div className="navbar-links">
        <a href="#home" onClick={() => handleNavigation('home')}>
          Home
        </a>
        {PLACEHOLDER_LINKS.map((link) => (
          <a
            key={link.target}
            href={link.href}
            onClick={(event) => {
              event.preventDefault()
              handleNavigation(`${link.target}_coming_soon`)
            }}
            aria-disabled="true"
            title="Coming soon"
          >
            {link.label}
            <span className="nav-soon"> soon</span>
          </a>
        ))}
        {clerkEnabled ? (
          <>
            <SignedOut>
              <SignInButton mode="redirect" forceRedirectUrl="/account">
                <button
                  type="button"
                  className="signin-btn"
                  onClick={() => handleNavigation('signin')}
                >
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <a href="/account" className="signin-btn" onClick={() => handleNavigation('account')}>
                Account
              </a>
              <span className="navbar-userbutton">
                <UserButton afterSignOutUrl="/" />
              </span>
            </SignedIn>
          </>
        ) : (
          <button
            type="button"
            className="signin-btn"
            onClick={() => handleNavigation('signin_setup_needed')}
            title="Add Clerk keys to .env.local — see docs/dashboard-setup.md"
          >
            Sign in
          </button>
        )}
      </div>
    </nav>
  )
}
