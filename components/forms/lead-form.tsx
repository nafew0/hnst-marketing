'use client'
import { useRouter } from 'next/navigation'
import { useId, useRef } from 'react'

import { captureAttribution } from '@/components/forms/attribution'
import { Captcha } from '@/components/forms/captcha'
import { ConsentFields } from '@/components/forms/consent-fields'
import {
  Form,
  Messages,
  SubmitButton,
  useFormContext,
} from '@/components/ui/form'
import { InputField, TextareaField } from '@/components/ui/form/fields'
import { addValidator } from '@/components/ui/form/hook'
import type { LeadCopy } from '@/lib/cms/form-copy'
import {
  emailSchema,
  nameSchema,
  phoneSchema,
  leadInputSchema,
  type Tier,
} from '@/lib/contracts'
import { api, newIdempotencyKey, toFormState } from '@/lib/contracts/client'
import { HONEYPOT_FIELD } from '@/lib/ghl/constants'
import type { FormState } from '@/lib/types/form'
import { zodToValidator } from '@/utils/validation'
addValidator('firstName', zodToValidator(nameSchema))
addValidator('email', zodToValidator(emailSchema))
addValidator('phone', zodToValidator(phoneSchema))
export interface ConsentCopy {
  email: string
  sms: string
  approved: boolean
}
interface Props {
  consent: ConsentCopy
  type: 'contact' | 'package' | 'magnet'
  tier?: Tier
  copy?: LeadCopy | undefined
}
function PhoneConsentError() {
  const { state } = useFormContext()
  const message = state.formState?.fieldErrors?.phone
  return message ? (
    <p role="alert" className="caption text-danger">
      {message}
    </p>
  ) : null
}
function ServerErrors() {
  const { state } = useFormContext()
  const errors = state.formState?.fieldErrors
  if (!errors) return null
  return (
    <ul role="alert" className="text-danger">
      {Object.entries(errors)
        .filter(
          ([field]) =>
            !['firstName', 'email', 'phone', 'message'].includes(field)
        )
        .map(([field, message]) => (
          <li key={field}>{message}</li>
        ))}
    </ul>
  )
}
export function LeadForm({ consent, type, tier, copy }: Props) {
  const id = useId()
  const router = useRouter()
  const keyRef = useRef<string | null>(null)
  const payloadRef = useRef<string | null>(null)
  const completeRef = useRef(false)
  async function submit(
    _previous: FormState | null,
    data: FormData
  ): Promise<FormState> {
    if (completeRef.current)
      return { status: 202, message: 'Already received.' }
    const field = (name: string) => String(data.get(name) ?? '')
    if (field(HONEYPOT_FIELD))
      return { status: 400, message: 'Unable to submit this form.' }
    if (!consent.approved && process.env.NEXT_PUBLIC_API_MOCKS !== '1')
      return { status: 503, message: 'This form is not available yet.' }
    const parsed = leadInputSchema.safeParse({
      type,
      firstName: field('firstName'),
      email: field('email'),
      phone: field('phone') || undefined,
      message: field('message') || undefined,
      packageInterest: tier,
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
        message: 'Please check the highlighted details.',
        fieldErrors: Object.fromEntries(
          parsed.error.issues.map((issue) => [
            issue.path.join('.'),
            issue.message,
          ])
        ),
      }
    const visitor = parsed.data
    const serialized = JSON.stringify({
      type: visitor.type,
      firstName: visitor.firstName,
      email: visitor.email,
      phone: visitor.phone,
      message: visitor.message,
      tier: visitor.packageInterest,
      consent: { email: visitor.consent.email, sms: visitor.consent.sms },
    })
    // Changed input is a new submission; unchanged retries retain the key.
    if (keyRef.current === null || payloadRef.current !== serialized) {
      keyRef.current = newIdempotencyKey()
      payloadRef.current = serialized
    }
    const body = { ...parsed.data, [HONEYPOT_FIELD]: '' }
    const result = await api.submitLead(body, keyRef.current)
    if (result.ok) {
      completeRef.current = true
      keyRef.current = null
    }
    const state = toFormState(result, 'Your request has been received.')
    return state.status === 0 ? { ...state, status: 503 } : state
  }
  const available =
    consent.approved || process.env.NEXT_PUBLIC_API_MOCKS === '1'
  if (!available)
    return (
      <p role="status">
        We’re getting this form ready. Please check back soon.
      </p>
    )
  return (
    <Form
      action={submit}
      onSuccess={() => router.push(`/thanks/${type}`)}
      className="flex flex-col dr-gap-24"
    >
      <InputField
        id={`${id}-firstName`}
        name="firstName"
        label={copy?.firstName ?? 'First name'}
        required
      />
      <InputField
        id={`${id}-email`}
        name="email"
        type="email"
        label={copy?.email ?? 'Email'}
        required
      />
      <InputField
        id={`${id}-phone`}
        name="phone"
        type="tel"
        label={copy?.phone ?? 'Phone (optional, international format)'}
      />
      <PhoneConsentError />
      {type !== 'magnet' && (
        <TextareaField
          id={`${id}-message`}
          name="message"
          label={copy?.message ?? 'Tell us about your business'}
        />
      )}
      <div hidden aria-hidden="true">
        <label htmlFor={`${id}-website-confirm`}>Leave this empty</label>
        <input
          id={`${id}-website-confirm`}
          name={HONEYPOT_FIELD}
          autoComplete="off"
          tabIndex={-1}
        />
      </div>
      <ConsentFields
        consent={consent}
        legend={copy?.consentLegend ?? 'Stay in touch (optional)'}
      />
      <Captcha />
      <ServerErrors />
      <Messages role="alert" />
      <SubmitButton
        className="min-h-[48px] rounded-full cta"
        pendingText={copy?.pending ?? 'Sending…'}
        successText={copy?.success ?? 'Received'}
        errorText={copy?.retry ?? 'Try again'}
      >
        {copy?.submit ??
          (type === 'magnet' ? 'Send me the guide' : 'Start the conversation')}
      </SubmitButton>
    </Form>
  )
}
export function ContactForm({ consent }: { consent: ConsentCopy }) {
  return <LeadForm type="contact" consent={consent} />
}
export function PackageInterestForm({
  consent,
  tier,
}: {
  consent: ConsentCopy
  tier: Tier
}) {
  return <LeadForm type="package" consent={consent} tier={tier} />
}
export function MagnetForm({
  consent,
  copy,
}: {
  consent: ConsentCopy
  copy?: LeadCopy | undefined
}) {
  return <LeadForm type="magnet" consent={consent} copy={copy} />
}
