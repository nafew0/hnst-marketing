import type { Field } from 'payload'
import { z } from 'zod'

export const bookingCopySchema = z.object({
  timezone: z.string().min(1),
  previousMonth: z.string().min(1),
  nextMonth: z.string().min(1),
  chooseDay: z.string().min(1),
  chooseTime: z.string().min(1),
  loading: z.string().min(1),
  emptySlots: z.string().min(1),
  unavailable: z.string().min(1),
  fallbackTitle: z.string().min(1),
  fallbackUnavailable: z.string().min(1),
  retry: z.string().min(1),
  name: z.string().min(1),
  email: z.string().min(1),
  phone: z.string().min(1),
  questions: z.string().min(1),
  consentLegend: z.string().min(1),
  submit: z.string().min(1),
  pending: z.string().min(1),
  success: z.string().min(1),
  error: z.string().min(1),
  invalid: z.string().min(1),
  chooseSlot: z.string().min(1),
  slotTaken: z.string().min(1),
  queued: z.string().min(1),
  confirmed: z.string().min(1),
  noReceipt: z.string().min(1),
  calendarTitle: z.string().min(1),
  download: z.string().min(1),
  google: z.string().min(1),
  reference: z.string().min(1),
})
export type BookingCopy = z.infer<typeof bookingCopySchema>
export const bookingCopyFields: Field[] = bookingCopySchema
  .keyof()
  .options.map((name) => ({ name, type: 'text', required: true }))

export const leadCopySchema = z.object({
  firstName: z.string().min(1),
  email: z.string().min(1),
  phone: z.string().min(1),
  consentLegend: z.string().min(1),
  submit: z.string().min(1),
  pending: z.string().min(1),
  success: z.string().min(1),
  retry: z.string().min(1),
  message: z.string().min(1),
  unavailable: z.string().min(1),
})
export type LeadCopy = z.infer<typeof leadCopySchema>
export const leadCopyFields: Field[] = leadCopySchema
  .keyof()
  .options.map((name) => ({ name, type: 'text', required: true }))
