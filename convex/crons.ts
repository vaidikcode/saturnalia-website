import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.interval('flush telemetry outbox', { minutes: 5 }, internal.telemetryActions.flushOutbox, {})

export default crons
