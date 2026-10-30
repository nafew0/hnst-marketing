import { expect, test } from 'bun:test'

import {
  addDays,
  calendarDays,
  calendarLinks,
  dateInZone,
} from '@/components/forms/booking-utils'

// Failure modes: UTC rollover and DST must not shift displayed dates; calendar
// exports must use only confirmed times and escape editable calendar text.
test('visitor dates and paging stay stable across UTC rollover and DST', () => {
  expect(dateInZone(new Date('2026-11-01T02:00:00Z'), 'America/New_York')).toBe(
    '2026-10-31'
  )
  expect(addDays('2026-10-31', 30)).toBe('2026-11-30')
  expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  const days = calendarDays('2026-11-01')
  expect(days.filter(Boolean)).toHaveLength(30)
  expect(days.length % 7).toBe(0)
})

test('confirmed calendar exports retain UTC instants and escape CMS text', () => {
  const links = calendarLinks(
    {
      appointmentId: 'confirmed-1',
      start: '2026-11-02T10:00:00-05:00',
      end: '2026-11-02T10:30:00-05:00',
    },
    'HONEST, discovery; call\nDetails',
    '2026-11-01T12:00:00Z'
  )
  const ics = decodeURIComponent(links.ics.split(',')[1] ?? '')
  expect(ics).toContain('DTSTAMP:20261101T120000Z')
  expect(ics).toContain('DTSTART:20261102T150000Z')
  expect(ics).toContain('DTEND:20261102T153000Z')
  expect(ics).toContain('SUMMARY:HONEST\\, discovery\\; call\\nDetails')
  expect(new URL(links.google).searchParams.get('dates')).toBe(
    '20261102T150000Z/20261102T153000Z'
  )
})
