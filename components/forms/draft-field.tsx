'use client'
import { useId } from 'react'

import { setDraftField, useVisitDrafts } from '@/components/forms/visit-drafts'
import { useFormContext } from '@/components/ui/form'

import s from '@/components/ui/form/fields/fields.module.css'

/** A form-context field whose value survives a sheet closing, in visit memory. */
export function DraftField({
  draftKey,
  name,
  label,
  type = 'text',
  required = false,
  disabled = false,
  multiline = false,
}: {
  draftKey: string
  name: string
  label: string
  type?: 'text' | 'email' | 'tel'
  required?: boolean
  disabled?: boolean
  multiline?: boolean
}) {
  const id = useId()
  const value = useVisitDrafts((state) => state.values[draftKey]?.[name])
  const { actions, state } = useFormContext()
  const registration = actions.register(name)
  const error =
    state.formState?.fieldErrors?.[name] ??
    (state.errors[name]?.state ? state.errors[name]?.message : undefined)
  const props = {
    ...registration,
    id,
    name,
    required,
    disabled,
    value: String(value ?? ''),
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${id}-error` : undefined,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      registration.onChange(event)
      setDraftField(draftKey, name, event.target.value)
    },
  }
  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {multiline ? (
        <textarea {...props} rows={4} className={s.textarea} />
      ) : (
        <input {...props} type={type} className={s.input} />
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className={s.errorMessage}>
          {error}
        </p>
      )}
    </div>
  )
}
