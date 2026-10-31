/** A form field's value, held in memory only: never written to browser storage. */
export interface FieldDraft {
  name: string
  value: string
  checked: boolean
}

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

const FIELDS = 'input[name]:not([type="hidden"]), textarea[name], select[name]'

function fieldsIn(root: Element) {
  return [...root.querySelectorAll<Field>(FIELDS)]
}

function isToggle(field: Field): field is HTMLInputElement {
  return (
    field instanceof HTMLInputElement &&
    (field.type === 'checkbox' || field.type === 'radio')
  )
}

export function captureDraft(root: Element): FieldDraft[] {
  return fieldsIn(root).map((field) => ({
    name: field.name,
    value: field.value,
    checked: isToggle(field) && field.checked,
  }))
}

/** Through the value setter and real events, so React and Base UI see the change. */
export function applyDraft(root: Element, draft: FieldDraft[]) {
  for (const field of fieldsIn(root)) {
    const saved = draft.find(
      (candidate) =>
        candidate.name === field.name &&
        (!isToggle(field) || candidate.value === field.value)
    )
    if (!saved) continue
    if (isToggle(field)) {
      if (field.checked !== saved.checked) field.click()
      continue
    }
    const setter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(field),
      'value'
    )?.set
    setter?.call(field, saved.value)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  }
}
