import { create } from 'zustand'

import { useWindows } from '@/components/ui/window/store'

import type { PhoneAppId } from '../registry'
import {
  fillNotification,
  type NotificationTrigger,
  PHONE_SETTINGS_DRAFT,
  type PhoneSettings,
} from '../settings'

/** The most banners one visit sees. Everything still reaches the centre. */
export const BANNERS_PER_VISIT = 3
export const BANNER_MS = 5000

export interface Delivered {
  id: string
  trigger: NotificationTrigger
  app: PhoneAppId
  title: string
  body: string
  at: number
}

interface NotificationsState {
  settings: PhoneSettings
  /** The Notification Centre, newest first. Memory only, for the visit. */
  delivered: Delivered[]
  /** Triggers already delivered this visit: each happens once. */
  seen: NotificationTrigger[]
  bannersShown: number
  banner: Delivered | null
  centreOpen: boolean
}

export const useNotifications = create<NotificationsState>(() => ({
  settings: PHONE_SETTINGS_DRAFT,
  delivered: [],
  seen: [],
  bannersShown: 0,
  banner: null,
  centreOpen: false,
}))

const { getState, setState } = useNotifications

export function setPhoneSettings(settings: PhoneSettings) {
  setState({ settings })
}

const TEXT_ENTRY =
  'input:not([type=checkbox],[type=radio],[type=button],[type=submit],[type=reset],[type=range],[type=color],[type=file]),textarea,select,[contenteditable=""],[contenteditable=true]'

/** A banner never interrupts typing, or someone framing a photo. */
function quietNow() {
  const typing = document.activeElement?.matches(TEXT_ENTRY) ?? false
  const camera = useWindows.getState().activeHref?.includes('app=camera')
  return typing || camera === true
}

interface NotifyOptions {
  /** `{time}` in the copy, for booking-confirmed: the real booked time. */
  time?: string
  /** False for the lock screen, which shows its own cards. */
  banner?: boolean
}

/**
 * Tells the visitor something happened, once per trigger per visit. It goes
 * to the Notification Centre, and as a banner unless the visit has had its
 * three, the visitor is typing or using the camera, or `banner` is false.
 * Copy comes from settings; a trigger with no enabled copy does nothing.
 */
export function notify(
  trigger: NotificationTrigger,
  options: NotifyOptions = {}
) {
  const { settings, seen, bannersShown, delivered } = getState()
  if (seen.includes(trigger)) return
  const copy = settings.notifications.filter(
    (item) => item.trigger === trigger && item.enabled
  )
  if (copy.length === 0) return
  const now = Date.now()
  const items = copy.map<Delivered>((item, index) => ({
    id: `${trigger}-${now}-${index}`,
    trigger,
    app: item.app,
    title: item.title,
    body: fillNotification(item.body, options),
    at: now,
  }))
  const [first] = items
  const showBanner =
    options.banner !== false &&
    first !== undefined &&
    bannersShown < BANNERS_PER_VISIT &&
    !quietNow()
  setState({
    seen: [...seen, trigger],
    delivered: [...items.toReversed(), ...delivered],
    ...(showBanner && { banner: first, bannersShown: bannersShown + 1 }),
  })
}

export function dismissBanner() {
  setState({ banner: null })
}

export function setCentreOpen(centreOpen: boolean) {
  setState({ centreOpen })
}

export function clearNotifications() {
  setState({ delivered: [] })
}

/** For tests and the lab: a fresh visit. */
export function resetNotifications() {
  setState({ delivered: [], seen: [], bannersShown: 0, banner: null })
}
