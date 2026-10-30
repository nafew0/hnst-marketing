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
