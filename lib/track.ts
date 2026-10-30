'use client'
import { eventsInputSchema, type EventsInput } from '@/lib/contracts'
import { api } from '@/lib/contracts/client'
import { apiRoutes } from '@/lib/contracts/routes'
let enabled = false
let queue: EventsInput['events'] = []
let anonId: string | undefined
export function setTrackingConsent(value: boolean) {
  enabled = value
  try {
    if (value) anonId = localStorage.getItem('hnst:anon') ?? crypto.randomUUID()
    else localStorage.removeItem('hnst:anon')
    if (value && anonId) localStorage.setItem('hnst:anon', anonId)
  } catch {
    /* Optional storage must not block navigation or forms. */
  }
  if (!value) {
    queue = []
    anonId = undefined
  }
}
export function track(
  name: EventsInput['events'][number]['name'],
  props: Record<string, string | number | boolean> = {}
) {
  if (!enabled) return
  if (!anonId) anonId = crypto.randomUUID()
  const parsed = eventsInputSchema.safeParse({
    anonId,
    events: [{ name, props, ts: new Date().toISOString() }],
  })
  if (parsed.success && queue.length < 100) queue.push(...parsed.data.events)
}
export async function flushEvents(beacon = false) {
  if (!enabled || !anonId || !queue.length) return
  const events = queue.splice(0, 20)
  const payload: EventsInput = { anonId, events }
  if (
    beacon &&
    navigator.sendBeacon(
      apiRoutes.events,
      new Blob([JSON.stringify(payload)], { type: 'application/json' })
    )
  )
    return
  await api.sendEvents(payload)
}
