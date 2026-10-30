import { GhlRequestError } from './errors'

const SLOT_TAKEN = /slot|unavailable|already booked|not available|conflict/i

export type BookingFailure = 'slot' | 'outage' | 'config' | 'other'

/** GoHighLevel rejects a taken slot with 400 or 422, sometimes 409. */
export function isSlotTaken(error: GhlRequestError): boolean {
  if (error.statusCode === 409) return true
  if (error.statusCode !== 400 && error.statusCode !== 422) return false
  return SLOT_TAKEN.test(error.message)
}

export function isConfigError(error: GhlRequestError): boolean {
  if (error.statusCode !== 0) return false
  return (
    /not set/u.test(error.message) || /Missing GoHighLevel/u.test(error.message)
  )
}

/** `cause` is the caught value. Slot conflicts are not retried through the outbox. */
export function classifyBookingError(cause: unknown): BookingFailure {
  if (!(cause instanceof GhlRequestError)) return 'other'
  if (isSlotTaken(cause)) return 'slot'
  if (isConfigError(cause)) return 'config'
  if (cause.statusCode === 0 || cause.statusCode >= 500) return 'outage'
  return 'other'
}
