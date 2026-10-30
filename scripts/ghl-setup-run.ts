import { env } from '@/lib/env'
import { createGhlClient } from '@/lib/ghl/client'
import { TAG_NAMES } from '@/lib/ghl/constants'

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is not set`)
  return value
}

const client = createGhlClient({
  token: required(env.GHL_PIT, 'GHL_PIT'),
  locationId: required(env.GHL_LOCATION_ID, 'GHL_LOCATION_ID'),
  pipelineId: required(env.GHL_PIPELINE_ID, 'GHL_PIPELINE_ID'),
  stageNewId: required(env.GHL_STAGE_NEW_ID, 'GHL_STAGE_NEW_ID'),
  stageCallBookedId: env.GHL_STAGE_CALL_BOOKED_ID ?? null,
  calendarId: env.GHL_CALENDAR_ID ?? null,
})

const fields = await client.ensureFields()
const tags = await client.ensureTags(TAG_NAMES)

console.log(
  '# Custom field and tag ids. The worker resolves fields by key; these lines are a record.'
)
for (const field of fields) {
  console.log(`GHL_FIELD_${field.key.toUpperCase()}=${field.id}`)
}
for (const tag of tags) {
  const name = tag.name.replaceAll(':', '_').replaceAll('-', '_').toUpperCase()
  console.log(`GHL_TAG_${name}=${tag.id}`)
}
