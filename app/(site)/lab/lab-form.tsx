'use client'

import { useRef } from 'react'

import { Form, Messages, SubmitButton } from '@/components/ui/form'
import { InputField, TextareaField } from '@/components/ui/form/fields'
import { Eyebrow, Heading } from '@/components/ui/heading'
import { Container, Section } from '@/components/ui/section'
import { useToast } from '@/components/ui/toast'
import { api, newIdempotencyKey, toFormState } from '@/lib/contracts/client'
import { sampleConsentText } from '@/lib/contracts/mocks/fixtures'
import type { FormState } from '@/lib/types/form'

/**
 * Contract round trip: Satus <Form> → api.submitLead → /api/v1/leads (MSW
 * when NEXT_PUBLIC_API_MOCKS=1). Use `taken@…`-style magic values from
 * lib/contracts/mocks/handlers.ts to see the error paths.
 */
export function LabForm() {
  const { toast } = useToast()
  // One key per submission; a retry after an error reuses it.
  const idempotencyKeyRef = useRef<string>(null)

  async function submit(
    _previous: FormState | null,
    formData: FormData
  ): Promise<FormState> {
    const field = (name: string) => String(formData.get(name) ?? '')
    idempotencyKeyRef.current ??= newIdempotencyKey()
    const result = await api.submitLead(
      {
        type: 'contact',
        firstName: field('firstName'),
        email: field('email'),
        message: field('message') || undefined,
        consent: {
          email: true,
          sms: false,
          emailText: sampleConsentText.email,
          smsText: '',
        },
        utm: {},
        pageUrl: window.location.href,
        altcha: field('email').startsWith('captcha@') ? 'fail' : 'lab',
      },
      idempotencyKeyRef.current
    )
    if (result.ok) idempotencyKeyRef.current = null
    return toFormState(result, 'Thanks. We will be in touch within a day.')
  }

  return (
    <Section aria-labelledby="lab-form">
      <Container className="flex max-w-[640px] flex-col dr-gap-24 dt:mx-[var(--safe)]">
        <Eyebrow>Contract round trip</Eyebrow>
        <Heading id="lab-form">Lead form → /api/v1/leads</Heading>
        <Form
          action={submit}
          onSuccess={(state) => toast.success(state.message)}
          onError={(state) => toast.error(state.message)}
          className="flex flex-col dr-gap-16"
        >
          <InputField id="firstName" label="First name" required />
          <InputField id="email" type="email" label="Email" required />
          <TextareaField id="message" label="Message" />
          <Messages />
          <SubmitButton
            className="min-h-[48px] rounded-full cta"
            pendingText="Sending…"
            successText="Sent"
            errorText="Try again"
          >
            Send
          </SubmitButton>
        </Form>
      </Container>
    </Section>
  )
}
