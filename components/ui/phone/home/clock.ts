import { useSyncExternalStore } from 'react'

const MINUTE = 60_000

function subscribe(onChange: () => void) {
  // On the next minute, then every minute.
  let timer = setTimeout(
    function tick() {
      onChange()
      timer = setTimeout(tick, MINUTE - (Date.now() % MINUTE))
    },
    MINUTE - (Date.now() % MINUTE)
  )
  return () => clearTimeout(timer)
}

const nowMinute = () => Math.floor(Date.now() / MINUTE) * MINUTE
const noTimeOnServer = () => null

/**
 * The visitor's own time, to the minute. Null in the server's HTML, whose
 * clock and time zone are not the visitor's; filled in on hydration.
 */
export function useClock() {
  const at = useSyncExternalStore(subscribe, nowMinute, noTimeOnServer)
  if (at === null) return null
  const date = new Date(at)
  return {
    time: date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }),
    date: date.toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
    short: date.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }),
  }
}
