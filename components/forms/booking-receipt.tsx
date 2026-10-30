'use client'
import { create } from 'zustand'

import { calendarLinks } from '@/components/forms/booking-utils'
import { Link } from '@/components/ui/link'
import type { BookingCopy } from '@/lib/cms/form-copy'
import type { BookingCreated } from '@/lib/contracts'

type Receipt =
  | {
      kind: 'confirmed'
      booking: BookingCreated
      tz: string
      createdAt: string
    }
  | { kind: 'queued'; ref: string }
interface ReceiptState {
  receipt: Receipt | null
  setReceipt: (receipt: Receipt) => void
}
// In memory only: no contact fields, browser storage or invented reload state.
export const useBookingReceipt = create<ReceiptState>((set) => ({
  receipt: null,
  setReceipt: (receipt) => set({ receipt }),
}))
export function BookingReceipt({ copy }: { copy: BookingCopy }) {
  const receipt = useBookingReceipt((state) => state.receipt)
  if (!receipt)
    return (
      <p role="status" className="p text-silver">
        {copy.noReceipt}
      </p>
    )
  if (receipt.kind === 'queued')
    return (
      <div role="status" className="flex flex-col dr-gap-16">
        <p className="p">{copy.queued}</p>
        <p className="caption">
          {copy.reference}: {receipt.ref}
        </p>
      </div>
    )
  const links = calendarLinks(
    receipt.booking,
    copy.calendarTitle,
    receipt.createdAt
  )
  return (
    <div className="flex flex-col dr-gap-24">
      <p role="status" className="p">
        {copy.confirmed}
      </p>
      <p className="p text-gold">
        {new Intl.DateTimeFormat(undefined, {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: receipt.tz,
        }).format(new Date(receipt.booking.start))}{' '}
        ({receipt.tz})
      </p>
      <div className="flex flex-wrap dr-gap-24">
        <Link
          href={links.ics}
          download="honest-discovery-call.ics"
          className="link text-gold"
        >
          {copy.download}
        </Link>
        <Link href={links.google} className="link text-gold">
          {copy.google}
        </Link>
      </div>
    </div>
  )
}
