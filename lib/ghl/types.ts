import type { LeadInput } from '@/lib/contracts'

import type { CustomFieldKey } from './constants'

export type LeadStatus = 'queued' | 'contacted' | 'noted' | 'done' | 'failed'

export interface FieldValue {
  key: CustomFieldKey
  value: string
}

/** What the lead job asks the client to write. The client maps field keys to ids. */
/** Shape passed to the SDK contact upsert. Optional fields are set only when present. */
export interface ContactUpsertBody {
  locationId: string
  firstName: string
  lastName?: string
  email: string
  phone?: string
  website?: string
  companyName?: string
  source: string
  tags: string[]
  customFields: { id: string; field_value: string }[]
  dndSettings?: { SMS: { status: string } }
}

export interface ContactRequest {
  firstName: string
  lastName?: string
  email: string
  phone?: string
  website?: string
  companyName?: string
  tags: string[]
  customFields: FieldValue[]
  /** True when the visitor did not consent to SMS. Sets SMS do-not-disturb. */
  smsDnd: boolean
}

export interface OpportunityRequest {
  contactId: string
  name: string
  /** Defaults to New. A booking passes call-booked. */
  stage?: 'new' | 'call-booked'
}

export interface AppointmentRequest {
  contactId: string
  startTime: string
  title: string
  description?: string
}

/** One flush writes each contact at most once: tags plus the intent_signals field. */
export interface IntentWrite {
  email: string
  tags: string[]
  signals: string
}

export type IntentResult = 'written' | 'missing'

export interface FreeSlotQuery {
  startMs: number
  endMs: number
  timezone: string
}

export interface CustomValue {
  id: string
  key: string
  name: string
  value: string
}

export interface ProductSummary {
  id: string
  name: string
}

/**
 * GoHighLevel helpers. Tests pass a fake. The browser never sees this.
 */
export interface GhlClient {
  upsertContact(input: ContactRequest): Promise<{ contactId: string }>
  addNote(contactId: string, body: string): Promise<{ noteId: string }>
  addTags(contactId: string, tags: string[]): Promise<void>
  upsertOpportunity(
    input: OpportunityRequest
  ): Promise<{ opportunityId: string }>
  getFreeSlots(input: FreeSlotQuery): Promise<Record<string, string[]>>
  createAppointment(
    input: AppointmentRequest
  ): Promise<{ appointmentId: string; start: string; end: string }>
  getCustomValues(): Promise<CustomValue[]>
  listProducts(): Promise<ProductSummary[]>
  /**
   * Finds the contact by email and updates tags and intent_signals in one
   * write. `missing` means there is no contact yet; the buffer keeps the events.
   */
  applyIntent(input: IntentWrite): Promise<IntentResult>
}

export interface OutboxLead {
  id: string
  idempotencyKey: string
  lead: LeadInput
  status: LeadStatus
  attempts: number
  ghlContactId: string | null
  ghlNoteId: string | null
  ghlOpportunityId: string | null
  lastError: string | null
}

export interface LeadProgress {
  status: 'contacted' | 'noted' | 'done'
  ghlContactId?: string
  ghlNoteId?: string
  ghlOpportunityId?: string
}
