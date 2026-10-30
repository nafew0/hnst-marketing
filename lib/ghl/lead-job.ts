import { contactRequest, noteBody, opportunityName } from './payloads'
import type { GhlClient, LeadProgress, OutboxLead } from './types'

/**
 * Delivers one outbox row. Each id is saved before the next step, so a retry
 * continues after the last write that landed. Tags are applied twice (on the
 * upsert and via addTags) because some locations ignore tags on upsert.
 * Cost: one extra request per new contact.
 */
export async function processLead(
  row: OutboxLead,
  ghl: GhlClient,
  save: (patch: LeadProgress) => Promise<void>,
  consentedAt: string
): Promise<void> {
  const lead = row.lead
  let contactId = row.ghlContactId
  if (contactId === null) {
    const request = contactRequest(lead, consentedAt)
    const created = await ghl.upsertContact(request)
    contactId = created.contactId
    await ghl.addTags(contactId, request.tags)
    await save({ status: 'contacted', ghlContactId: contactId })
  }

  if (row.ghlNoteId === null) {
    const note = await ghl.addNote(contactId, noteBody(lead))
    await save({ status: 'noted', ghlNoteId: note.noteId })
  }

  if (row.ghlOpportunityId === null) {
    const opportunity = await ghl.upsertOpportunity({
      contactId,
      name: opportunityName(lead),
    })
    await save({ status: 'done', ghlOpportunityId: opportunity.opportunityId })
  }
}
