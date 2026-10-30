import type { BookingInput, LeadInput } from '@/lib/contracts'

import {
  CALL_BOOKED_TAG,
  DISCOVERY_CALL_TITLE,
  type CustomFieldKey,
} from './constants'
import type { ContactRequest, FieldValue } from './types'

export function leadTags(lead: LeadInput): string[] {
  const tags = ['src:website', `lead:${lead.type}`]
  if (lead.packageInterest) tags.push(`pkg:${lead.packageInterest}`)
  return tags
}

/** Evidence stored beside the submission: the exact sentences the visitor saw. */
export function consentEvidence(submission: {
  consent: { emailText: string; smsText: string }
}): string {
  return `email: ${submission.consent.emailText}\nsms: ${submission.consent.smsText}`
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
  description?: string
}) {
  const body = {
    calendarId: input.calendarId,
    locationId: input.locationId,
    contactId: input.contactId,
    startTime: input.startTime,
    title: input.title,
  }
  if (!input.description) return body
  return { ...body, description: input.description }
}

/**
 * Create-appointment on API version 2021-07-28 returns an id and no times.
 * The follow-up event read supplies them. `fallbackStart` is the slot we sent.
 */
export function readAppointmentTimes(input: {
  id: string
  startTime: string | null
  endTime: string | null
  fetchedStart: string | null
  fetchedEnd: string | null
  fallbackStart: string
}): { appointmentId: string; start: string; end: string } | null {
  const start = input.startTime ?? input.fetchedStart ?? input.fallbackStart
  const end = input.endTime ?? input.fetchedEnd
  if (!end) return null
  return { appointmentId: input.id, start, end }
}

export function bookingFieldValues(
  booking: BookingInput,
  consentedAt: string
): FieldValue[] {
  const fields: FieldValue[] = [
    { key: 'landing_page', value: booking.pageUrl },
    { key: 'sms_consent_text', value: booking.consent.smsText },
  ]
  if (booking.consent.sms)
    fields.push({ key: 'sms_consent_at', value: consentedAt })
  pushField(fields, 'utm_source', booking.utm.source)
  pushField(fields, 'utm_medium', booking.utm.medium)
  pushField(fields, 'utm_campaign', booking.utm.campaign)
  pushField(fields, 'utm_content', booking.utm.content)
  pushField(fields, 'utm_term', booking.utm.term)
  return fields
}

export function bookingContactRequest(
  booking: BookingInput,
  consentedAt: string
): ContactRequest {
  const request: ContactRequest = {
    firstName: booking.contact.firstName,
    email: booking.contact.email,
    tags: ['src:website', CALL_BOOKED_TAG],
    customFields: bookingFieldValues(booking, consentedAt),
    smsDnd: !booking.consent.sms,
  }
  if (booking.contact.lastName) request.lastName = booking.contact.lastName
  if (booking.contact.phone) request.phone = booking.contact.phone
  return request
}

/** Qualifying answers ride on the appointment. A separate note would be another write. */
export function bookingDescription(booking: BookingInput): string {
  const lines = [`Page: ${booking.pageUrl}`]
  for (const [key, value] of Object.entries(booking.answers)) {
    lines.push(`${key}: ${value}`)
  }
  return lines.join('\n').slice(0, 2000)
}

export function bookingOpportunityName(booking: BookingInput): string {
  const person = booking.contact.lastName
    ? `${booking.contact.firstName} ${booking.contact.lastName}`
    : booking.contact.firstName
  return `${DISCOVERY_CALL_TITLE}: ${person}`
}
