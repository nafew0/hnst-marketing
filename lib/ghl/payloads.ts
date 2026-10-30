import type { LeadInput } from '@/lib/contracts'

import type { CustomFieldKey } from './constants'
import type { ContactRequest, FieldValue } from './types'

export function leadTags(lead: LeadInput): string[] {
  const tags = ['src:website', `lead:${lead.type}`]
  if (lead.packageInterest) tags.push(`pkg:${lead.packageInterest}`)
  return tags
}

/** Evidence stored beside the lead: the exact sentences the visitor saw. */
export function consentEvidence(lead: LeadInput): string {
  return `email: ${lead.consent.emailText}\nsms: ${lead.consent.smsText}`
}

export function noteBody(lead: LeadInput): string {
  const message =
    lead.message && lead.message.trim() !== ''
      ? lead.message.trim()
      : 'No message'
  return `${message}\n\nPage: ${lead.pageUrl}`
}

export function opportunityName(lead: LeadInput): string {
  const person = lead.lastName
    ? `${lead.firstName} ${lead.lastName}`
    : lead.firstName
  return `Website ${lead.type}: ${person}`
}

function pushField(
  fields: FieldValue[],
  key: CustomFieldKey,
  value: string | undefined
) {
  if (value === undefined || value === '') return
  fields.push({ key, value })
}

/**
 * Custom-field values for one lead. Empty UTM parts are omitted. SMS consent
 * time is sent only when the box was checked; the text is always sent, even
 * when blank, so the record shows what was (or was not) agreed.
 */
export function leadFieldValues(
  lead: LeadInput,
  consentedAt: string
): FieldValue[] {
  const fields: FieldValue[] = [
    { key: 'lead_type', value: lead.type },
    { key: 'landing_page', value: lead.pageUrl },
    { key: 'sms_consent_text', value: lead.consent.smsText },
  ]
  if (lead.consent.sms)
    fields.push({ key: 'sms_consent_at', value: consentedAt })
  pushField(fields, 'package_interest', lead.packageInterest)
  pushField(fields, 'utm_source', lead.utm.source)
  pushField(fields, 'utm_medium', lead.utm.medium)
  pushField(fields, 'utm_campaign', lead.utm.campaign)
  pushField(fields, 'utm_content', lead.utm.content)
  pushField(fields, 'utm_term', lead.utm.term)
  return fields
}

export function contactRequest(
  lead: LeadInput,
  consentedAt: string
): ContactRequest {
  const request: ContactRequest = {
    firstName: lead.firstName,
    email: lead.email,
    tags: leadTags(lead),
    customFields: leadFieldValues(lead, consentedAt),
    smsDnd: !lead.consent.sms,
  }
  if (lead.lastName) request.lastName = lead.lastName
  if (lead.phone) request.phone = lead.phone
  if (lead.website) request.website = lead.website
  if (lead.company) request.companyName = lead.company
  return request
}

/**
 * Appointment body. `ignoreFreeSlotValidation` is intentionally absent: a taken
 * slot must come back as a conflict, not a double booking.
 */
export function appointmentBody(input: {
  calendarId: string
  locationId: string
  contactId: string
  startTime: string
  title: string
}) {
  return {
    calendarId: input.calendarId,
    locationId: input.locationId,
    contactId: input.contactId,
    startTime: input.startTime,
    title: input.title,
  }
}
