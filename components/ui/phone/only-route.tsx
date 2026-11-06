'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { type ComponentType, useEffect } from 'react'

import { WindowRoute } from '@/components/ui/window/route'
import { useDeviceDetection } from '@/hooks/use-device-detection'

import {
  APP_PARAM,
  isPhoneOnlyApp,
  phoneApp,
  phoneOnlyHref,
  type PhoneOnlyAppId,
} from './registry'

// Each app loads only when opened. Their owners replace these modules.
const VIEWS = {
  camera: dynamic(() => import('@/components/apps/camera')),
  notes: dynamic(() => import('@/components/apps/notes')),
} satisfies Record<PhoneOnlyAppId, ComponentType>

let firstLoadClaimed = false

/** True once per page load: the first time a phone sees this route. */
function claimFirstLoad() {
  if (firstLoadClaimed) return false
  firstLoadClaimed = true
  return true
}

/** `/`'s own title (the layout's default), where these apps open and close. */
const SITE_TITLE = 'HONEST Marketing'

/**
 * Opens a phone-only app (`/?app=camera`) as a window over the home screen,
 * so Back, the home bar and minimising work as for any page. Rendered in the
 * `@window` slot of `/`. Phones only: on a computer the URL is just `/`.
 */
export function PhoneOnlyRoute() {
  const id = useSearchParams().get(APP_PARAM)
  const { isMobile } = useDeviceDetection()
  const app = isPhoneOnlyApp(id) ? phoneApp(id) : null

  // A visit that starts inside an app has no home screen under it in the
  // history, so Back and home would leave the site. Put `/` under it first.
  // The native calls, which Next syncs its hooks to: its router's replace and
  // push in one tick collapse into a single replace.
  useEffect(() => {
    if (!isMobile || !claimFirstLoad() || !isPhoneOnlyApp(id)) return
    history.replaceState(null, '', '/')
    history.pushState(null, '', phoneOnlyHref(id))
  }, [isMobile, id])

  // Intercepted pages set their title through metadata. These can't without
  // making `/` dynamic, so the title is held here, over Next's own updates.
  useEffect(() => {
    if (!app || !isMobile) return
    const title = `${app.label} | ${SITE_TITLE}`
    const hold = () => {
      if (document.title !== title) document.title = title
    }
    hold()
    const observer = new MutationObserver(hold)
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    })
    return () => {
      observer.disconnect()
      document.title = SITE_TITLE
    }
  }, [app, isMobile])

  if (!isPhoneOnlyApp(id) || !app || !isMobile) return null
  const View = VIEWS[id]
  return (
    <WindowRoute href={phoneOnlyHref(id)} title={app.label}>
      <View />
    </WindowRoute>
  )
}
