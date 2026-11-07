'use client'
import { create } from 'zustand'

import type { FormState } from '@/lib/types/form'

export interface Submission {
  key: string | null
  intent: string | null
  uncertain: boolean
  complete: boolean
  pending: Promise<FormState> | null
}
const EMPTY: Record<string, string | boolean> = {}
/** Visit memory only. Never persist visitor input or idempotency state. */
export const useVisitDrafts = create<{
  values: Record<string, Record<string, string | boolean>>
}>(() => ({ values: {} }))
const submissions = new Map<string, Submission>()
export function submissionFor(key: string): Submission {
  const existing = submissions.get(key)
  if (existing) return existing
  const submission: Submission = {
    key: null,
    intent: null,
    uncertain: false,
    complete: false,
    pending: null,
  }
  submissions.set(key, submission)
  return submission
}
export function draftValues(key: string) {
  return useVisitDrafts.getState().values[key] ?? EMPTY
}
export function setDraftField(
  key: string,
  field: string,
  value: string | boolean
) {
  useVisitDrafts.setState((state) => ({
    values: {
      ...state.values,
      [key]: { ...state.values[key], [field]: value },
    },
  }))
}
export function clearDraft(key: string) {
  useVisitDrafts.setState((state) => ({
    values: { ...state.values, [key]: {} },
  }))
}
