'use client'

import { useSyncExternalStore } from 'react'

import { PhoneAppIcon } from '@/components/ui/window/dock-icons'

import { phoneApp } from '../registry'
import type { Delivered } from './store'

import s from './notifications.module.css'

const MINUTE = 60_000

function subscribeMinutes(onChange: () => void) {
  const timer = setInterval(onChange, MINUTE)
  return () => clearInterval(timer)
}

const minuteNow = () => Math.floor(Date.now() / MINUTE)
const noMinuteOnServer = () => 0

/** `at` 0: the lock screen's own cards, which are this visit's first. */
function ago(at: number, nowMinute: number) {
  if (at === 0) return 'now'
  const minutes = nowMinute - Math.floor(at / MINUTE)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

/** One notification: its app, when, its title and body. The caller makes it a control. */
export function NotificationCard({ item }: { item: Delivered }) {
  const nowMinute = useSyncExternalStore(
    subscribeMinutes,
    minuteNow,
    noMinuteOnServer
  )
  const app = phoneApp(item.app)
  return (
    <span className={s.card}>
      <span className={s.cardIcon}>
        <PhoneAppIcon id={item.app} />
      </span>
      <span className={s.cardText}>
        <span className={s.cardMeta}>
          <span className={s.cardApp}>{app.label}</span>
          <span className={s.cardTime}>
            {nowMinute === 0 ? '' : ago(item.at, nowMinute)}
          </span>
        </span>
        <span className={s.cardTitle}>{item.title}</span>
        <span className={s.cardBody}>{item.body}</span>
      </span>
    </span>
  )
}
