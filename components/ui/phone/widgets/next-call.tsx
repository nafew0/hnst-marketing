'use client'

import { useEffect, useState } from 'react'

import { addDays, dateInZone } from '@/components/forms/booking-utils'
import { useMeasure } from '@/components/ui/window/genie'
import { api } from '@/lib/contracts/client'

import { useOpenApp } from '../open'
import { phoneApp } from '../registry'
import type { PhoneSettings } from '../settings'

import s from './widgets.module.css'

type Slot = { kind: 'loading' } | { kind: 'none' } | { kind: 'at'; at: Date }

/** 31 days: the most the slots API answers at once. */
const LOOK_AHEAD_DAYS = 30

/**
 * The next open Discovery Call time, read live from the slots API, in the
 * visitor's own time zone. Opens Calendar. When there's no time in the next
 * month, or the API fails, it says so in its own words and still opens it.
 */
export function NextCallWidget({
  copy,
  active,
}: {
  copy: PhoneSettings['widgets']
  /** Fetch only on a phone with the home screen up. */
  active: boolean
}) {
  const openApp = useOpenApp()
  const [setMeasureRef, measure] = useMeasure()
  const [slot, setSlot] = useState<Slot>({ kind: 'loading' })

  useEffect(() => {
    if (!active) return
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const from = dateInZone(new Date(), tz)
    let current = true
    void api
      .getSlots({ from, to: addDays(from, LOOK_AHEAD_DAYS), tz })
      .then((result) => {
        if (!current) return
        // Today's earlier times may still be listed: the first one ahead.
        const first = result.ok
          ? result.data.days
              .flatMap((day) => day.slots)
              .find((at) => Date.parse(at) > Date.now())
          : undefined
        setSlot(first ? { kind: 'at', at: new Date(first) } : { kind: 'none' })
      })
    return () => {
      current = false
    }
  }, [active])

  const day =
    slot.kind === 'at'
      ? slot.at.toLocaleDateString(undefined, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      : null
  const time =
    slot.kind === 'at'
      ? slot.at.toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        })
      : null

  return (
    <button
      ref={setMeasureRef}
      type="button"
      className={s.widget}
      data-widget="next-call"
      onClick={() => openApp(phoneApp('calendar'), measure())}
    >
      <span className={s.widgetTitle}>{copy.nextCallTitle}</span>
      {slot.kind === 'at' ? (
        <span className={s.widgetValue}>
          <span className={s.widgetDay}>{day}</span>
          <span className={s.widgetTime}>{time}</span>
        </span>
      ) : (
        <span className={s.widgetNote}>
          {slot.kind === 'loading' ? '' : copy.nextCallEmpty}
        </span>
      )}
    </button>
  )
}
