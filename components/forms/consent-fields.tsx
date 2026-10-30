'use client'
import type { ConsentCopy } from '@/components/forms/lead-form'

interface ConsentFieldsProps {
  consent: ConsentCopy
  legend: string
  disabled?: boolean | undefined
}
export function ConsentFields({
  consent,
  legend,
  disabled = false,
}: ConsentFieldsProps) {
  return (
    <fieldset disabled={disabled} className="flex flex-col dr-gap-16">
      <legend className="dr-mb-12 p font-[500]">{legend}</legend>
      <label className="flex items-start dr-gap-12 p">
        <input
          type="checkbox"
          name="consent.email"
          className="mt-[4px] size-[20px] shrink-0 appearance-auto accent-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        />
        <span>{consent.email}</span>
      </label>
      <label className="flex items-start dr-gap-12 p">
        <input
          type="checkbox"
          name="consent.sms"
          className="mt-[4px] size-[20px] shrink-0 appearance-auto accent-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        />
        <span>{consent.sms}</span>
      </label>
    </fieldset>
  )
}
