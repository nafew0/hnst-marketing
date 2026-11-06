import { create } from 'zustand'

import type { Box } from '@/components/ui/window/genie'

/** The phone layout's own state, for the visit, in memory only. */
interface PhoneState {
  /** The homepage story is open (the HONEST app), not the home screen. */
  story: boolean
  /** The icon just tapped: its window zooms out of it once it opens. */
  launch: string | null
  /** Where each tapped icon sat, so going home can zoom back into it. */
  icons: Record<string, Box>
  /**
   * The lock screen is up. Null until the home screen checks on mount, so the
   * server's HTML (lock shown, or hidden by the layout's script) hydrates as is.
   */
  locked: boolean | null
  /** The classic website is on: today's mobile pages, no phone layout. */
  classic: boolean
}

export const usePhone = create<PhoneState>(() => ({
  story: false,
  launch: null,
  icons: {},
  locked: null,
  classic: false,
}))

const { getState, setState } = usePhone

/** The flag the layout's script reads before paint; it holds no visitor input. */
export const UNLOCKED_KEY = 'hnst-phone-unlocked'
const UNLOCKED_ATTRIBUTE = 'data-phone-unlocked'

/** Whether the lock screen should be up now, once the page is in the browser. */
export function syncLocked(lockScreen: boolean) {
  const unlocked =
    !lockScreen || document.documentElement.hasAttribute(UNLOCKED_ATTRIBUTE)
  setState({ locked: !unlocked })
}

export function unlock() {
  try {
    sessionStorage.setItem(UNLOCKED_KEY, '1')
  } catch {
    // Storage blocked: it unlocks for this page view only.
  }
  document.documentElement.setAttribute(UNLOCKED_ATTRIBUTE, '')
  setState({ locked: false })
}

/** The visit's classic-website flag, read before paint; it holds no visitor input. */
export const CLASSIC_KEY = 'hnst-phone-classic'
const CLASSIC_ATTRIBUTE = 'data-phone-classic'

export function syncClassic() {
  setState({
    classic: document.documentElement.hasAttribute(CLASSIC_ATTRIBUTE),
  })
}

function setClassic(classic: boolean) {
  try {
    if (classic) sessionStorage.setItem(CLASSIC_KEY, '1')
    else sessionStorage.removeItem(CLASSIC_KEY)
  } catch {
    // Storage blocked: the choice lasts for this page view only.
  }
  document.documentElement.toggleAttribute(CLASSIC_ATTRIBUTE, classic)
  setState({ classic })
}

/** The classic website: today's mobile pages, for the rest of the visit. */
export function enterClassic() {
  setClassic(true)
}

export function leaveClassic() {
  setClassic(false)
}

export function openStory() {
  setState({ story: true })
}

export function showHome() {
  setState({ story: false })
}

export function launchFrom(href: string, icon: Box | null) {
  setState(({ icons }) => ({
    launch: href,
    icons: icon ? { ...icons, [href]: icon } : icons,
  }))
}

/** True once for the window an icon just launched. */
export function takeLaunch(href: string) {
  if (getState().launch !== href) return false
  setState({ launch: null })
  return true
}

/** The icon a window came from, walking up from a tier page to its parent. */
export function iconOf(href: string) {
  const { icons } = getState()
  let path = href
  while (path.length > 1) {
    const icon = icons[path]
    if (icon) return icon
    path = path.slice(0, path.lastIndexOf('/')) || '/'
  }
  return icons['/'] ?? null
}
