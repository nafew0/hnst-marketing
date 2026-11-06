'use client'

import { useEffect, useRef } from 'react'

import { useWindows } from '@/components/ui/window/store'
import { useDeviceDetection } from '@/hooks/use-device-detection'

import { ClassicBar } from '../classic'
import type { PhoneSettings } from '../settings'
import { syncClassic, usePhone } from '../store'
import { NotificationBanner } from './banner'
import { NotificationCentre } from './centre'
import { notify, setPhoneSettings, useNotifications } from './store'

import s from './notifications.module.css'

const inPackages = (href: string | null) =>
  href === '/packages' || href?.startsWith('/packages/') === true

/**
 * The phone layout's notification layer, in the site layout so a banner can
 * appear over any page. Phones only. Announces each banner politely without
 * moving focus.
 */
export function PhoneHost({ settings }: { settings: PhoneSettings }) {
  const { isMobile } = useDeviceDetection()
  const banner = useNotifications((state) => state.banner)
  const activeHref = useWindows((state) => state.activeHref)
  const previous = useRef<string | null>(null)
  const classic = usePhone((state) => state.classic)

  useEffect(() => setPhoneSettings(settings), [settings])
  useEffect(() => syncClassic(), [])

  // Left Packages for anything but booking: offer a call about it.
  useEffect(() => {
    const left = inPackages(previous.current) && !inPackages(activeHref)
    if (isMobile && left && activeHref !== '/book') notify('left-packages')
    previous.current = activeHref
  }, [activeHref, isMobile])

  if (!isMobile) return null
  // The classic website is today's mobile site: no phone notifications.
  if (classic) return <ClassicBar />
  return (
    <>
      <NotificationBanner />
      <NotificationCentre />
      <div aria-live="polite" data-phone-announcer className={s.announcer}>
        {banner ? `Notification: ${banner.title}. ${banner.body}` : ''}
      </div>
    </>
  )
}
