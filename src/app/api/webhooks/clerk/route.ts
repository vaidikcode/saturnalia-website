import { verifyWebhook } from '@clerk/nextjs/webhooks'
import type { NextRequest } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../../../convex/_generated/api'

export async function POST(req: NextRequest) {
  let event
  try {
    event = await verifyWebhook(req)
  } catch (error) {
    console.error('Clerk webhook verification failed', error)
    return new Response('Verification failed', { status: 400 })
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!convexUrl) {
    return new Response('Convex URL not configured', { status: 500 })
  }

  const client = new ConvexHttpClient(convexUrl)
  const webhookSecret = process.env.CLERK_CONVEX_WEBHOOK_BRIDGE_SECRET
  if (!webhookSecret) {
    console.error('CLERK_CONVEX_WEBHOOK_BRIDGE_SECRET missing')
    return new Response('Bridge secret missing', { status: 500 })
  }

  if (event.type === 'user.updated' || event.type === 'user.created') {
    const email = event.data.email_addresses?.[0]?.email_address
    const name = [event.data.first_name, event.data.last_name].filter(Boolean).join(' ').trim()
    await client.mutation(api.webhooks.applyClerkUserEvent, {
      bridgeSecret: webhookSecret,
      clerkSubject: event.data.id,
      email,
      name: name || undefined,
      deleted: false,
    })
  }

  if (event.type === 'user.deleted' && event.data.id) {
    await client.mutation(api.webhooks.applyClerkUserEvent, {
      bridgeSecret: webhookSecret,
      clerkSubject: event.data.id,
      deleted: true,
    })
  }

  return new Response('ok', { status: 200 })
}
