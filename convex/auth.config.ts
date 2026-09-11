import type { AuthConfig } from 'convex/server'

/**
 * Clerk JWT issuer domain is set per deployment in the Convex dashboard:
 * CLERK_JWT_ISSUER_DOMAIN=https://verb-noun-00.clerk.accounts.dev
 *
 * In Clerk, enable the Convex integration and ensure the JWT template is named "convex".
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: 'convex',
    },
  ],
} satisfies AuthConfig
