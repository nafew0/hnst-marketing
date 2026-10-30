import { describe, expect, it } from 'bun:test'

import type { LeadInput } from '@/lib/contracts'

import { processLead } from './lead-job'
import type {
  AppointmentRequest,
  ContactRequest,
  FreeSlotQuery,
  GhlClient,
  LeadProgress,
  OpportunityRequest,
  OutboxLead,
} from './types'

const lead = {
  type: 'contact',
  firstName: 'Ada',
  email: 'ada@example.com',
  consent: { email: true, sms: false, emailText: 'Send email', smsText: '' },
  utm: { source: 'newsletter' },
  pageUrl: 'https://hnst.marketing/contact',
  altcha: 'ok',
} satisfies LeadInput

function row(): OutboxLead {
  return {
    id: '4f1c2a7e-6b3d-4a90-8c1e-2d5f7a9b0c11',
    idempotencyKey: '6b9f1c2e-0a4d-4e3b-9c1a-2f4d6e8a0b1c',
    lead,
    status: 'queued',
    attempts: 0,
    ghlContactId: null,
    ghlNoteId: null,
    ghlOpportunityId: null,
    lastError: null,
  }
}

function fakeGhl(failNotes: number) {
  const calls = { contacts: 0, notes: 0, tags: 0, opportunities: 0 }
  let noteAttempts = 0
  const seen: ContactRequest[] = []
  const client: GhlClient = {
    async upsertContact(input: ContactRequest) {
      calls.contacts += 1
      seen.push(input)
      return { contactId: 'contact-1' }
    },
    async addNote() {
      noteAttempts += 1
      calls.notes += 1
      if (noteAttempts <= failNotes) throw new Error('note failed')
      return { noteId: 'note-1' }
    },
    async addTags() {
      calls.tags += 1
    },
    async upsertOpportunity(_input: OpportunityRequest) {
      calls.opportunities += 1
      return { opportunityId: 'opp-1' }
    },
    async getFreeSlots(_input: FreeSlotQuery) {
      return {}
    },
    async createAppointment(_input: AppointmentRequest) {
      return { appointmentId: 'appt-1', start: 's', end: 'e' }
    },
    async getCustomValues() {
      return []
    },
    async listProducts() {
      return []
    },
  }
  return { calls, seen, client }
}

describe('processLead', () => {
  it('resumes after a partial failure without creating a second contact', async () => {
    const current = row()
    const { calls, seen, client } = fakeGhl(1)
    const save = async (patch: LeadProgress) => {
      if (patch.ghlContactId) current.ghlContactId = patch.ghlContactId
      if (patch.ghlNoteId) current.ghlNoteId = patch.ghlNoteId
      if (patch.ghlOpportunityId)
        current.ghlOpportunityId = patch.ghlOpportunityId
      current.status = patch.status
    }

    await expect(
      processLead(current, client, save, '2026-10-30T00:00:00.000Z')
    ).rejects.toThrow('note failed')
    expect(current.ghlContactId).toBe('contact-1')
    expect(current.status).toBe('contacted')

    await processLead(current, client, save, '2026-10-30T00:00:00.000Z')
    expect(calls).toEqual({ contacts: 1, notes: 2, tags: 1, opportunities: 1 })
    expect(current.status).toBe('done')
    expect(current.ghlOpportunityId).toBe('opp-1')
    expect(seen[0]?.tags).toEqual(['src:website', 'lead:contact'])
    expect(seen[0]?.smsDnd).toBe(true)
    expect(
      seen[0]?.customFields.some((field) => field.key === 'utm_source')
    ).toBe(true)
  })
})
