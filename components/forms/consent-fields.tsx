'use client'
import type { ConsentCopy } from '@/components/forms/lead-form'
import { setDraftField, useVisitDrafts } from '@/components/forms/visit-drafts'

interface ConsentFieldsProps {
  consent: ConsentCopy
  legend: string
  disabled?: boolean | undefined
  draftKey?: string | undefined
}
export function ConsentFields({
  consent,
  legend,
  disabled = false,
  draftKey,
}: ConsentFieldsProps) {
  const values = useVisitDrafts((state) =>
    draftKey ? state.values[draftKey] : undefined
  )
  return (
    <fieldset disabled={disabled} className="flex flex-col dr-gap-16">
      <legend className="dr-mb-12 p font-[500]">{legend}</legend>
      <label className="flex items-start dr-gap-12 p">
        <input
          type="checkbox"
          name="consent.email"
          {...(draftKey
            ? {
                checked: values?.['consent.email'] === true,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                  setDraftField(
                    draftKey,
                    'consent.email',
                    event.target.checked
                  ),
              }
            : {})}
          className="mt-[4px] size-[20px] shrink-0 appearance-auto accent-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        />
        <span>{consent.email}</span>
      </label>
      <label className="flex items-start dr-gap-12 p">
        <input
          type="checkbox"
          name="consent.sms"
          {...(draftKey
            ? {
                checked: values?.['consent.sms'] === true,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                  setDraftField(draftKey, 'consent.sms', event.target.checked),
              }
            : {})}
          className="mt-[4px] size-[20px] shrink-0 appearance-auto accent-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        />
        <span>{consent.sms}</span>
      </label>
    </fieldset>
  )
}
