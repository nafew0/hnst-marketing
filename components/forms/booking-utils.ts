import type { BookingCreated } from '@/lib/contracts'

export function addDays(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + amount)
  return value.toISOString().slice(0, 10)
}
export function dateInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const field = (name: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === name)?.value ?? ''
  return `${field('year')}-${field('month')}-${field('day')}`
}
export function calendarDays(month: string): (string | null)[] {
  const first = new Date(`${month.slice(0, 7)}-01T12:00:00Z`)
  const days: (string | null)[] = Array.from(
    { length: first.getUTCDay() },
    () => null
  )
  const cursor = new Date(first)
  while (cursor.getUTCMonth() === first.getUTCMonth()) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  while (days.length % 7) days.push(null)
  return days
}
export function shiftMonth(month: string, amount: number) {
  const date = new Date(`${month.slice(0, 7)}-01T12:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + amount)
  return date.toISOString().slice(0, 10)
}
function calendarDate(date: string) {
  return new Date(date)
    .toISOString()
    .replaceAll(/[-:]/gu, '')
    .replace(/\.\d{3}Z$/u, 'Z')
}
function calendarText(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('\r', '')
    .replaceAll('\n', '\\n')
    .replaceAll(',', '\\,')
    .replaceAll(';', '\\;')
}
export function calendarLinks(
  booking: BookingCreated,
  title: string,
  createdAt: string
) {
  const start = calendarDate(booking.start)
  const end = calendarDate(booking.end)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HNST//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${calendarText(booking.appointmentId)}@hnst.marketing`,
    `DTSTAMP:${calendarDate(createdAt)}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${calendarText(title)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  const content = lines
    .map((line) => {
      const pieces: string[] = []
      let current = ''
      for (const char of line) {
        if (new TextEncoder().encode(current + char).length > 73) {
          pieces.push(current)
          current = ' '
        }
        current += char
      }
      pieces.push(current)
      return pieces.join('\r\n')
    })
    .join('\r\n')
  const ics = `${content}\r\n`
  return {
    ics: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`,
    google: `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${start}/${end}` })}`,
  }
}
