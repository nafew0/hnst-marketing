/** pg-boss queue that delivers a lead to GoHighLevel. */
export const LEAD_QUEUE = 'ghl.lead'

/** Jobs land here after LEAD_MAX_FAILURES failed attempts. */
export const LEAD_DLQ = 'ghl.lead.dlq'

/**
 * Retries after the first attempt. pg-boss dead-letters when `retry_count`
 * reaches this limit, which is the 8th failure.
 */
export const LEAD_RETRY_LIMIT = 7

export const LEAD_MAX_FAILURES = LEAD_RETRY_LIMIT + 1

/** Header on every GoHighLevel call. Calendars may reject it; do not switch quietly. */
export const GHL_API_VERSION = '2021-07-28'

/** Per-location ceiling. The worker stays under the burst limit. */
export const GHL_MAX_RPS = 8

/** Hidden form field. Absent or empty is a person; anything else is a bot. */
export const HONEYPOT_FIELD = 'company_website_confirm'

export const HEARTBEAT_ID = 'worker'

export const HEARTBEAT_MS = 30_000

/** A killed worker's job is retried after this many seconds. */
export const LEAD_EXPIRE_SECONDS = 60

/** pg-boss queue that finishes a booking GoHighLevel accepted only partway. */
export const BOOKING_QUEUE = 'ghl.booking'

/** Jobs land here after LEAD_MAX_FAILURES failed booking attempts. */
export const BOOKING_DLQ = 'ghl.booking.dlq'

/** Same retry budget as a lead. A booking is one contact, not a batch. */
export const BOOKING_RETRY_LIMIT = LEAD_RETRY_LIMIT

export const BOOKING_EXPIRE_SECONDS = 120

/**
 * Rows left `processing` by a crashed request are picked up after this.
 * Cost: a booking that legitimately runs longer is recovered twice; the
 * steps are saved after each GoHighLevel write, so the second run continues.
 */
export const BOOKING_STALE_SECONDS = 120

/** pg-boss queue. One scheduled job groups the event buffer. */
export const EVENTS_FLUSH_QUEUE = 'ghl.events.flush'

/** Every fifth minute. Anonymous rows older than the retention window are deleted in the same pass. */
export const EVENTS_FLUSH_CRON = '*/5 * * * *'

export const EVENTS_FLUSH_LOCK = 582026

/** Advisory-lock class for one Idempotency-Key. Paired with hashtext(key). */
export const BOOKING_LOCK_CLASS = 582027

/** Events with no email are not a contact. Keep them this long, then delete. */
export const ANONYMOUS_EVENT_DAYS = 30

/** In-memory free-slot cache, per (from, to, tz). */
export const SLOT_CACHE_MS = 60_000

/** Data Cache tag for GET /api/v1/offers. The offer-changed webhook expires it. */
export const OFFERS_CACHE_TAG = 'offers'

/** Backstop when the webhook does not fire. Ten minutes. */
export const OFFERS_REVALIDATE_SECONDS = 600

export const CALL_BOOKED_TAG = 'stage:call-booked'

export const DISCOVERY_CALL_TITLE = 'Discovery Call'

/** intent_signals is a single text field. Keep the newest lines under this cap. */
export const INTENT_SIGNAL_LIMIT = 3500

export const CUSTOM_FIELD_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'landing_page',
  'package_interest',
  'lead_type',
  'sms_consent_text',
  'sms_consent_at',
  'intent_signals',
] as const

export type CustomFieldKey = (typeof CUSTOM_FIELD_KEYS)[number]

export const FIELD_LABELS = {
  utm_source: 'UTM Source',
  utm_medium: 'UTM Medium',
  utm_campaign: 'UTM Campaign',
  utm_content: 'UTM Content',
  utm_term: 'UTM Term',
  landing_page: 'Landing Page',
  package_interest: 'Package Interest',
  lead_type: 'Lead Type',
  sms_consent_text: 'SMS Consent Text',
  sms_consent_at: 'SMS Consent At',
  intent_signals: 'Intent Signals',
} satisfies Record<CustomFieldKey, string>

export const TAG_NAMES = [
  'src:website',
  'lead:contact',
  'lead:magnet',
  'lead:package',
  'lead:gift',
  'pkg:basic-diy',
  'pkg:executive',
  'pkg:founder',
  'pkg:diamond',
  'stage:call-booked',
  'intent:pricing',
  'intent:video',
  'intent:pkg-basic-diy',
  'intent:pkg-executive',
  'intent:pkg-founder',
  'intent:pkg-diamond',
] as const
