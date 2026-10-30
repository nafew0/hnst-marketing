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
}

export interface AppointmentRequest {
  contactId: string
  startTime: string
  title: string
}

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
 * The eight helpers P2 requires. Tests pass a fake. The browser never sees this.
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
