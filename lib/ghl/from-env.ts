import { env } from '@/lib/env'

import { createGhlClient } from './client'
import type { GhlClient } from './types'

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is not set`)
  return value
}

/** Server-side client from the frozen env names. The token never leaves this process. */
export function ghlFromEnv(): GhlClient {
  return createGhlClient({
    token: required(env.GHL_PIT, 'GHL_PIT'),
    locationId: required(env.GHL_LOCATION_ID, 'GHL_LOCATION_ID'),
    pipelineId: required(env.GHL_PIPELINE_ID, 'GHL_PIPELINE_ID'),
    stageNewId: required(env.GHL_STAGE_NEW_ID, 'GHL_STAGE_NEW_ID'),
    stageCallBookedId: env.GHL_STAGE_CALL_BOOKED_ID ?? null,
    calendarId: env.GHL_CALENDAR_ID ?? null,
  })
}
