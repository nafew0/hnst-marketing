'use server'
import { consentCopy } from '@/components/sections/standard/catalog'
import { getPhoneNotes, getSettings } from '@/lib/cms/data'

/** Published editorial notes only; no visitor input reaches this loader. */
export async function loadNotes() {
  const [notes, settings] = await Promise.all([getPhoneNotes(), getSettings()])
  return {
    notes: notes
      .filter((note) => note._status === 'published')
      .map(({ id, title, body }) => ({ id, title, body })),
    consent: consentCopy(settings),
  }
}
