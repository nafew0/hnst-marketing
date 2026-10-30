import type { EventName, EventsInput, Tier } from '@/lib/contracts'
import { tierSchema } from '@/lib/contracts'

import { ANONYMOUS_EVENT_DAYS, INTENT_SIGNAL_LIMIT } from './constants'

type EventProps = NonNullable<EventsInput['events'][number]['props']>

/** One buffered analytics event. `email` is null until the visitor is known. */
export interface BufferedEvent {
  id: number
  anonId: string
  email: string | null
  name: EventName
  props: EventProps | null
  ts: string
}

/** Tags and the intent_signals text for one contact, from one flush. */
export interface IntentGroup {
  email: string
  tags: string[]
  signals: string
  ids: number[]
}

const TAG_ORDER = [
  'intent:pricing',
  'intent:video',
  'intent:pkg-basic-diy',
  'intent:pkg-executive',
  'intent:pkg-founder',
  'intent:pkg-diamond',
] as const

const DAY_MS = 24 * 60 * 60 * 1000

function tierFrom(props: EventProps | null): Tier | null {
  if (!props) return null
  const candidates = [props.tier, props.package, props.packageInterest]
  for (const candidate of candidates) {
    const parsed = tierSchema.safeParse(candidate)
    if (parsed.success) return parsed.data
  }
  return null
}

function tagsFor(event: BufferedEvent): string[] {
  if (event.name === 'pricing_viewed') return ['intent:pricing']
  if (event.name === 'video_completed') return ['intent:video']
  if (event.name === 'package_clicked') {
    const tier = tierFrom(event.props)
    return tier ? [`intent:pkg-${tier}`] : []
  }
  return []
}

function signalLine(event: BufferedEvent): string {
  const tier = tierFrom(event.props)
  const suffix = tier ? `:${tier}` : ''
  return `${event.name}${suffix}@${event.ts}`
}

/** Keeps the newest distinct lines inside the custom-field cap. */
export function mergeSignals(existing: string, addition: string): string {
  const lines: string[] = []
  const seen = new Set<string>()
  for (const source of [existing, addition]) {
    for (const line of source.split('\n')) {
      const trimmed = line.trim()
      if (trimmed === '' || seen.has(trimmed)) continue
      seen.add(trimmed)
      lines.push(trimmed)
    }
  }
  while (lines.join('\n').length > INTENT_SIGNAL_LIMIT && lines.length > 1) {
    lines.shift()
  }
  const joined = lines.join('\n')
  if (joined.length <= INTENT_SIGNAL_LIMIT) return joined
  return joined.slice(joined.length - INTENT_SIGNAL_LIMIT)
}

/**
 * One group per email. Anonymous rows are omitted; the flush deletes them
 * on the retention window instead of writing them to GoHighLevel.
 */
export function groupForFlush(events: BufferedEvent[]): IntentGroup[] {
  const byEmail = new Map<string, BufferedEvent[]>()
  for (const event of events) {
    if (!event.email) continue
    const grouped = byEmail.get(event.email) ?? []
    grouped.push(event)
    byEmail.set(event.email, grouped)
  }

  const groups: IntentGroup[] = []
  for (const [email, grouped] of byEmail) {
    const wanted = new Set<string>()
    for (const event of grouped) {
      for (const tag of tagsFor(event)) wanted.add(tag)
    }
    groups.push({
      email,
      tags: TAG_ORDER.filter((tag) => wanted.has(tag)),
      signals: grouped.map((event) => signalLine(event)).join('\n'),
      ids: grouped.map((event) => event.id),
    })
  }
  return groups
}

/** Anonymous rows older than 30 days. Emailed rows stay until a contact exists. */
export function expiredAnonymousIds(
  events: BufferedEvent[],
  now: Date
): number[] {
  const cutoff = now.getTime() - ANONYMOUS_EVENT_DAYS * DAY_MS
  const ids: number[] = []
  for (const event of events) {
    if (event.email) continue
    const ts = Date.parse(event.ts)
    if (Number.isNaN(ts) || ts >= cutoff) continue
    ids.push(event.id)
  }
  return ids
}
