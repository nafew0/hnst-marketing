import type { ReactNode } from 'react'
import { create } from 'zustand'

import type { FieldDraft } from './drafts'

/** One page in the window layer. Lives in memory only, for the visit. */
export interface WindowEntry {
  href: string
  title: string
  /** Null until the route delivers it: loading, or minimised from a direct visit. */
  content: ReactNode
  minimised: boolean
  /** Field values to put back: a direct visit's page can't stay mounted. */
  draft: FieldDraft[] | null
}

interface WindowsState {
  entries: WindowEntry[]
  /** The visible window, if any. Only one is ever visible. */
  activeHref: string | null
  /** The intercepted route currently mounted, which tracks the URL. */
  routeHref: string | null
  fullscreen: boolean
}

export const useWindows = create<WindowsState>(() => ({
  entries: [],
  activeHref: null,
  routeHref: null,
  fullscreen: false,
}))

const { getState, setState } = useWindows

/**
 * A window's route mounted. An existing entry keeps its content, so a restored
 * window is the one that was minimised. Anything else not minimised goes: a
 * link inside a window replaces that window.
 */
export function openRoute({
  href,
  title,
  content,
}: Pick<WindowEntry, 'href' | 'title' | 'content'>) {
  const { entries } = getState()
  const existing = entries.find((entry) => entry.href === href)
  const opened: WindowEntry = {
    href,
    title: title || existing?.title || '',
    content: existing?.content ?? content,
    minimised: false,
    draft: existing?.draft ?? null,
  }
  setState({
    routeHref: href,
    activeHref: href,
    entries: [
      ...entries.filter((entry) => entry.minimised && entry.href !== href),
      opened,
    ],
  })
}

/** The route unmounted. Its neighbour may mount in the same commit. */
export function leaveRoute(href: string) {
  if (getState().routeHref === href) setState({ routeHref: null })
}

/** No window's route is mounted any more: close, keeping what's minimised. */
export function settle() {
  setState(({ entries }) => ({
    activeHref: null,
    fullscreen: false,
    entries: entries.filter((entry) => entry.minimised),
  }))
}

export function setMinimised(
  entry: Pick<WindowEntry, 'href' | 'title' | 'draft'>
) {
  setState(({ entries }) => ({
    activeHref: null,
    fullscreen: false,
    entries: [
      ...entries.filter((candidate) => candidate.href !== entry.href),
      {
        ...entry,
        content:
          entries.find((candidate) => candidate.href === entry.href)?.content ??
          null,
        minimised: true,
      },
    ],
  }))
}

/** Shows a minimised window at once; the URL catches up behind it. */
export function setRestored(href: string) {
  setState(({ entries }) => ({
    activeHref: href,
    entries: entries.map((entry) =>
      entry.href === href ? { ...entry, minimised: false } : entry
    ),
  }))
}

export function clearDraft(href: string) {
  setState(({ entries }) => ({
    entries: entries.map((entry) =>
      entry.href === href ? { ...entry, draft: null } : entry
    ),
  }))
}

export function dismissMinimised(href: string) {
  setState(({ entries }) => ({
    entries: entries.filter((entry) => entry.href !== href),
  }))
}

export function toggleFullscreen() {
  setState(({ fullscreen }) => ({ fullscreen: !fullscreen }))
}
