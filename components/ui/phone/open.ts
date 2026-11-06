'use client'

import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import type { Box } from '@/components/ui/window/genie'
import {
  parkActive,
  setRestored,
  useWindows,
} from '@/components/ui/window/store'

import { type PhoneApp, phoneOnlyHref } from './registry'
import { launchFrom, openStory } from './store'

/** Where an app's window lives, or null for apps that open no window. */
export function appHref(app: PhoneApp) {
  if (app.opens.kind === 'route') return app.opens.href
  if (app.id === 'camera' || app.id === 'notes') return phoneOnlyHref(app.id)
  return null
}

/**
 * Opens an app the way its icon does, from anywhere: a notification, a
 * widget, the Notification Centre. A minimised app comes back as it was; the
 * open one stays as it is, behind. `icon` is where the zoom starts.
 */
export function useOpenApp() {
  const router = useRouter()
  return (app: PhoneApp, icon: Box | null = null) => {
    if (app.opens.kind === 'story' || app.opens.kind === 'classic') {
      openStory()
      return
    }
    const href = appHref(app)
    if (!href) return
    const minimised = useWindows
      .getState()
      .entries.some((entry) => entry.href === href && entry.minimised)
    launchFrom(href, icon)
    parkActive()
    if (minimised) setRestored(href)
    // SAFETY: `href` comes from the app registry, whose routes all exist.
    router.push(href as Route, { scroll: false })
  }
}
