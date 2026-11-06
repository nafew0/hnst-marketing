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
}

export const usePhone = create<PhoneState>(() => ({
  story: false,
  launch: null,
  icons: {},
}))

const { getState, setState } = usePhone

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
