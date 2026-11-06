'use client'

import { useEffect, useRef } from 'react'

import { useWindows } from '@/components/ui/window/store'
import { useDeviceDetection } from '@/hooks/use-device-detection'

import type { PhoneSettings } from '../settings'
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

  useEffect(() => setPhoneSettings(settings), [settings])

  // Left Packages for anything but booking: offer a call about it.
  useEffect(() => {
    const left = inPackages(previous.current) && !inPackages(activeHref)
    if (isMobile && left && activeHref !== '/book') notify('left-packages')
    previous.current = activeHref
  }, [activeHref, isMobile])

  if (!isMobile) return null
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
