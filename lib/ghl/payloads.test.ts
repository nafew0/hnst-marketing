import { describe, expect, it } from 'bun:test'

import type { LeadInput } from '@/lib/contracts'

import { appointmentBody, contactRequest, noteBody } from './payloads'

const lead = {
  type: 'package',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  message: '  Hello  ',
  packageInterest: 'founder',
  consent: {
    email: false,
    sms: true,
    emailText: 'Email line',
    smsText: 'Text line',
  },
  utm: {},
  pageUrl: 'https://hnst.marketing/packages/founder',
  altcha: 'ok',
  phone: '+12025550123',
} satisfies LeadInput

describe('lead payloads', () => {
  it('builds tags, consent fields and a note from the submission', () => {
    const request = contactRequest(lead, '2026-10-30T00:00:00.000Z')
    expect(request.tags).toEqual(['src:website', 'lead:package', 'pkg:founder'])
    expect(request.smsDnd).toBe(false)
    expect(request.phone).toBe('+12025550123')
    expect(request.customFields).toContainEqual({
      key: 'sms_consent_at',
      value: '2026-10-30T00:00:00.000Z',
    })
    expect(request.customFields).toContainEqual({
      key: 'package_interest',
      value: 'founder',
    })
    expect(noteBody(lead)).toBe(
      'Hello\n\nPage: https://hnst.marketing/packages/founder'
    )
  })

  it('never asks GoHighLevel to ignore a taken slot', () => {
    const body = appointmentBody({
      calendarId: 'cal',
      locationId: 'loc',
      contactId: 'contact',
      startTime: '2026-11-04T14:30:00-05:00',
      title: 'Discovery Call',
    })
    expect('ignoreFreeSlotValidation' in body).toBe(false)
  })
})
