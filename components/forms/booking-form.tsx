'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'

import { captureAttribution } from '@/components/forms/attribution'
import { useBookingReceipt } from '@/components/forms/booking-receipt'
import {
  calendarDays,
  addDays,
  dateInZone,
  shiftMonth,
} from '@/components/forms/booking-utils'
import { Captcha } from '@/components/forms/captcha'
import { ConsentFields } from '@/components/forms/consent-fields'
import type { ConsentCopy } from '@/components/forms/lead-form'
import { Button } from '@/components/ui/button'
import {
  Form,
  Messages,
  SubmitButton,
  useFormContext,
} from '@/components/ui/form'
import { InputField, TextareaField } from '@/components/ui/form/fields'
import { addValidator } from '@/components/ui/form/hook'
import { Select } from '@/components/ui/select'
import type { BookingCopy } from '@/lib/cms/form-copy'
import {
  bookingInputSchema,
  emailSchema,
  nameSchema,
  phoneSchema,
  timezoneSchema,
  type SlotsResponse,
} from '@/lib/contracts'
import { api, newIdempotencyKey, toFormState } from '@/lib/contracts/client'
import { HONEYPOT_FIELD } from '@/lib/ghl/constants'
import { track } from '@/lib/track'
import type { FormState } from '@/lib/types/form'
import { zodToValidator } from '@/utils/validation'

addValidator('contact.firstName', zodToValidator(nameSchema))
addValidator('contact.email', zodToValidator(emailSchema))
addValidator('contact.phone', zodToValidator(phoneSchema))
interface Question {
  id: string
  question: string
}
interface BookingFormProps {
  copy: BookingCopy
  consent: ConsentCopy
  questions: Question[]
  embedUrl: string | null
}
function BookingErrors() {
  const { state } = useFormContext()
  const errors = state.formState?.fieldErrors
  return errors ? (
    <ul role="alert" className="p text-danger">
      {Object.entries(errors).map(([name, message]) => (
        <li key={name}>{message}</li>
      ))}
    </ul>
  ) : null
}
function subscribeTimezone(notify: () => void) {
  window.addEventListener('focus', notify)
  const timer = window.setInterval(notify, 60000)
  return () => {
    window.removeEventListener('focus', notify)
    window.clearInterval(timer)
  }
}
function browserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}
function serverTimezone() {
  return 'UTC'
}
function browserClock() {
  return Math.floor(Date.now() / 60000) * 60000
}
function serverClock() {
  return 0
}
function availabilityMessage(
  copy: BookingCopy,
  loading: boolean,
  unavailable: boolean,
  count: number
) {
  if (loading) return copy.loading
  if (unavailable) return copy.unavailable
  if (!count) return copy.emptySlots
  return ''
}
export function BookingForm({
  copy,
  consent,
  questions,
  embedUrl,
}: BookingFormProps) {
  const id = useId()
  const router = useRouter()
  const setReceipt = useBookingReceipt((state) => state.setReceipt)
  const detectedTz = useSyncExternalStore(
    subscribeTimezone,
    browserTimezone,
    serverTimezone
  )
  const now = useSyncExternalStore(subscribeTimezone, browserClock, serverClock)
  const ready = now !== 0
  const [chosenTz, setChosenTz] = useState<string | null>(null)
  const tz = chosenTz ?? detectedTz
  const today = dateInZone(new Date(now), tz)
  const [chosenMonth, setChosenMonth] = useState<string | null>(null)
  const month = chosenMonth ?? `${today.slice(0, 7)}-01`
  const [day, setDay] = useState('')
  const [slot, setSlot] = useState('')
  const [availability, setAvailability] = useState<{
    key: string
    days: SlotsResponse['days']
    failed: boolean
  } | null>(null)
  const [revision, setRevision] = useState(0)
  const [conflict, setConflict] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [timezoneOpen, setTimezoneOpen] = useState(false)
  const keyRef = useRef<string | null>(null)
  const intentRef = useRef<string | null>(null)
  const pendingRef = useRef<Promise<FormState> | null>(null)
  const [uncertain, setUncertain] = useState(false)
  const navigatedRef = useRef(false)
  const confirmedRef = useRef(false)
  const available =
    consent.approved || process.env.NEXT_PUBLIC_API_MOCKS === '1'
  const requestKey = `${month}|${tz}|${revision}`
  const current = availability?.key === requestKey
  const slots = current
    ? availability.days
        .map((item) => ({
          ...item,
          slots: item.slots.filter((time) => Date.parse(time) > now),
        }))
        .filter((item) => item.slots.length > 0)
    : []
  const loading = !ready || !current
  const unavailable = current && availability.failed
  useEffect(() => {
    if (!ready || !available) return
    let active = true
    const currentDate = dateInZone(new Date(), tz)
    const from = month < currentDate ? currentDate : month
    track('booking_step', { step: 'availability', timezone: tz })
    void api.getSlots({ from, to: addDays(from, 30), tz }).then((result) => {
      if (active)
        setAvailability({
          key: requestKey,
          days: result.ok ? result.data.days : [],
          failed: !result.ok,
        })
    })
    return () => {
      active = false
    }
  }, [ready, month, tz, requestKey, available])
  function changeTimezone(value: string | null) {
    if (!value) return
    setChosenTz(value)
    setChosenMonth(null)
    setDay('')
    setSlot('')
    setConflict(false)
    track('booking_step', { step: 'timezone', timezone: value })
  }
  function changeMonth(amount: number) {
    setChosenMonth(shiftMonth(month, amount))
    setDay('')
    setSlot('')
    setConflict(false)
  }
  async function performSubmit(data: FormData): Promise<FormState> {
    if (confirmedRef.current) return { status: 202, message: copy.success }
    const field = (name: string) => String(data.get(name) ?? '')
    if (field(HONEYPOT_FIELD)) return { status: 400, message: copy.invalid }
    if (!available) return { status: 503, message: copy.unavailable }
    if (!slot) return { status: 400, message: copy.chooseSlot }
    const parsed = bookingInputSchema.safeParse({
      slot,
      tz,
      contact: {
        firstName: field('contact.firstName'),
        email: field('contact.email'),
        phone: field('contact.phone') || undefined,
      },
      // Keyed by the question's words, not its CMS row id: GoHighLevel shows
      // these keys to the Founder. The contract caps a key at 80 characters.
      answers: Object.fromEntries(
        questions.map((question) => [
          question.question.slice(0, 80),
          field(`answers.${question.id}`),
        ])
      ),
      consent: {
        email: data.get('consent.email') === 'on',
        sms: data.get('consent.sms') === 'on',
        emailText: consent.email,
        smsText: consent.sms,
      },
      utm: captureAttribution(),
      pageUrl: window.location.href,
      altcha: field('altcha'),
    })
    if (!parsed.success)
      return {
        status: 400,
        message: copy.invalid,
        fieldErrors: Object.fromEntries(
          parsed.error.issues.map((issue) => [
            issue.path.join('.'),
            issue.message,
          ])
        ),
      }
    const input = parsed.data
    const intent = JSON.stringify({
      slot: input.slot,
      tz: input.tz,
      contact: input.contact,
      answers: input.answers,
      consent: { email: input.consent.email, sms: input.consent.sms },
    })
    // After a lost response the first attempt may have booked, so every retry
    // keeps its key, edited or not: the server replays that booking if it
    // exists, and only otherwise creates this one. A new key could book twice.
    let key = keyRef.current
    const replaying = uncertain && key !== null
    if (!replaying && !slots.some((item) => item.slots.includes(slot)))
      return { status: 400, message: copy.chooseSlot }
    if (!key || (!replaying && intentRef.current !== intent)) {
      key = newIdempotencyKey()
      keyRef.current = key
      intentRef.current = intent
    }
    track('booking_step', { step: 'submit' })
    const body = { ...input, [HONEYPOT_FIELD]: '' }
    const result = await api.book(body, key)
    if (result.ok) {
      confirmedRef.current = true
      keyRef.current = null
      setUncertain(false)
      if ('appointmentId' in result.data)
        setReceipt({
          kind: 'confirmed',
          booking: result.data,
          createdAt: new Date(now).toISOString(),
          tz,
        })
      else setReceipt({ kind: 'queued', ref: result.data.ref })
      track('booking_step', {
        step: 'appointmentId' in result.data ? 'confirmed' : 'queued',
      })
    } else if (result.status === 409 && result.error.code === 'slot_taken') {
      setUncertain(false)
      setSlot('')
      setDay('')
      setConflict(true)
      setRevision((value) => value + 1)
      return { status: 409, message: copy.slotTaken }
    } else if (result.status === 0 || result.status >= 500) setUncertain(true)
    const state = toFormState(result, copy.success)
    return state.status === 0
      ? { ...state, status: 503, message: copy.error }
      : state
  }
  async function submit(
    _previous: FormState | null,
    data: FormData
  ): Promise<FormState> {
    if (pendingRef.current) return pendingRef.current
    setSubmitting(true)
    const pending = performSubmit(data).finally(() => {
      pendingRef.current = null
      setSubmitting(false)
    })
    pendingRef.current = pending
    return pending
  }
  if (!available)
    return (
      <p role="status" className="p">
        {copy.unavailable}
      </p>
    )
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(2026, 10, 1 + index)))
  )
  const cells = ready ? calendarDays(month) : []
  const selectedSlots = slots.find((item) => item.date === day)?.slots ?? []
  return (
    <div className="flex min-w-0 flex-col dr-gap-32">
      <div className="flex min-w-0 flex-col dr-gap-12">
        <label
          id={`${id}-timezone-label`}
          htmlFor={`${id}-timezone`}
          className="p"
        >
          {copy.timezone}
        </label>
        <Select.Root
          value={tz}
          onOpenChange={setTimezoneOpen}
          disabled={submitting}
          onValueChange={(value) => {
            const parsed = timezoneSchema.safeParse(value)
            if (parsed.success) changeTimezone(parsed.data)
          }}
        >
          <Select.Trigger
            id={`${id}-timezone`}
            aria-labelledby={`${id}-timezone-label`}
            className="min-h-[44px] w-full min-w-0 text-left break-all"
          >
            <Select.Value>{tz}</Select.Value>
            <Select.Icon />
          </Select.Trigger>
          {timezoneOpen && (
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  {['UTC', ...Intl.supportedValuesOf('timeZone')].map(
                    (zone) => (
                      <Select.Item key={zone} value={zone}>
                        <Select.ItemIndicator>✓</Select.ItemIndicator>
                        <Select.ItemText>{zone}</Select.ItemText>
                      </Select.Item>
                    )
                  )}
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          )}
        </Select.Root>
      </div>
      {conflict && (
        <p role="alert" className="p text-gold">
          {copy.slotTaken}
        </p>
      )}
      <div aria-busy={loading} className="flex flex-col dr-gap-24">
        <div className="flex flex-wrap items-center justify-between dr-gap-16">
          <Button
            variant="ghost"
            onClick={() => changeMonth(-1)}
            disabled={
              !month || month.slice(0, 7) <= today.slice(0, 7) || loading
            }
          >
            {copy.previousMonth}
          </Button>
          <Button
            variant="ghost"
            onClick={() => changeMonth(1)}
            disabled={!month || loading || submitting}
          >
            {copy.nextMonth}
          </Button>
        </div>
        {ready && month && (
          <table className="w-full table-fixed text-center p">
            <caption className="dr-pb-24 p-big">
              {new Intl.DateTimeFormat(undefined, {
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC',
              }).format(new Date(`${month}T12:00:00Z`))}{' '}
              — {copy.chooseDay}
            </caption>
            <thead>
              <tr>
                {weekdays.map((name) => (
                  <th
                    key={name}
                    scope="col"
                    className="dr-pb-12 caption text-silver"
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: cells.length / 7 }, (_, row) => (
                <tr key={cells[row * 7 + 6] ?? month}>
                  {cells.slice(row * 7, row * 7 + 7).map((date, col) => (
                    <td key={date ?? `empty-${col}`} className="p-[2px]">
                      {date && (
                        <button
                          type="button"
                          disabled={
                            loading ||
                            submitting ||
                            !slots.some(
                              (item) => item.date === date && item.slots.length
                            )
                          }
                          aria-pressed={date === day}
                          aria-label={new Intl.DateTimeFormat(undefined, {
                            dateStyle: 'full',
                            timeZone: 'UTC',
                          }).format(new Date(`${date}T12:00:00Z`))}
                          onClick={() => {
                            setDay(date)
                            setSlot('')
                            setConflict(false)
                            track('booking_step', { step: 'day' })
                          }}
                          className="min-h-[44px] w-full rounded-[8px] border border-gold/30 px-[2px] text-starlight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-35 aria-pressed:bg-gold aria-pressed:text-void"
                        >
                          {Number(date.slice(-2))}
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p role="status" className="caption text-silver">
          {availabilityMessage(
            copy,
            loading,
            unavailable,
            slots.filter((item) => item.date.slice(0, 7) === month.slice(0, 7))
              .length
          )}
        </p>
      </div>
      {unavailable && (
        <div className="flex flex-col dr-gap-24">
          <Button
            variant="ghost"
            onClick={() => setRevision((value) => value + 1)}
          >
            {copy.retry}
          </Button>
          {embedUrl && !uncertain ? (
            <iframe
              src={embedUrl}
              title={copy.fallbackTitle}
              className="min-h-[720px] w-full rounded-[16px] border border-gold/30"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <p className="p text-silver">{copy.fallbackUnavailable}</p>
          )}
        </div>
      )}
      <Form
        action={submit}
        onSuccess={() => {
          if (!navigatedRef.current) {
            navigatedRef.current = true
            router.push('/thanks/booking')
          }
        }}
        className="flex flex-col dr-gap-24"
      >
        <fieldset className="flex flex-wrap dr-gap-12">
          <legend className="dr-mb-16 p-big">{copy.chooseTime}</legend>
          {selectedSlots.map((time) => (
            <label
              key={time}
              className="flex min-h-[44px] items-center dr-gap-8 rounded-[8px] border border-gold/30 dr-px-16"
            >
              <input
                type="radio"
                name="slot"
                value={time}
                checked={slot === time}
                onChange={() => {
                  setSlot(time)
                  setConflict(false)
                  track('booking_step', { step: 'slot' })
                }}
                className="size-[20px] appearance-auto accent-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              />
              <span>
                {new Intl.DateTimeFormat(undefined, {
                  timeStyle: 'short',
                  timeZone: tz,
                }).format(new Date(time))}
              </span>
            </label>
          ))}
        </fieldset>
        <InputField
          id={`${id}-name`}
          name="contact.firstName"
          label={copy.name}
          required
          disabled={submitting}
        />
        <InputField
          id={`${id}-email`}
          name="contact.email"
          type="email"
          label={copy.email}
          required
          disabled={submitting}
        />
        <InputField
          id={`${id}-phone`}
          name="contact.phone"
          type="tel"
          label={copy.phone}
        />
        {questions.length > 0 && (
          <fieldset className="flex flex-col dr-gap-24">
            <legend className="dr-mb-16 p-big">{copy.questions}</legend>
            {questions.map((question) => (
              <TextareaField
                key={question.id}
                id={`${id}-${question.id}`}
                name={`answers.${question.id}`}
                label={question.question}
                required
                disabled={submitting}
                rows={2}
              />
            ))}
          </fieldset>
        )}
        <div hidden aria-hidden="true">
          <label htmlFor={`${id}-website`}>{copy.invalid}</label>
          <input
            id={`${id}-website`}
            name={HONEYPOT_FIELD}
            autoComplete="off"
            tabIndex={-1}
          />
        </div>
        <ConsentFields
          consent={consent}
          legend={copy.consentLegend}
          disabled={submitting}
        />
        <Captcha />
        <BookingErrors />
        <Messages role="alert" />
        <SubmitButton
          disabled={
            !slot || loading || (!uncertain && !selectedSlots.includes(slot))
          }
          pendingText={copy.pending}
          successText={copy.success}
          errorText={copy.retry}
          className="min-h-[48px] rounded-full cta"
        >
          {copy.submit}
        </SubmitButton>
      </Form>
    </div>
  )
}
