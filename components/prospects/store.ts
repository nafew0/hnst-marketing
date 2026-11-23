import { useSyncExternalStore } from 'react'

/*
 * The prospect's name for this page view, from their tagged link. In memory
 * only: it holds visitor-linked data, so it never goes into storage.
 */
let name: string | null = null
const listeners = new Set<() => void>()

export function setProspectName(next: string | null) {
  name = next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const current = () => name
const none = () => null

export function useProspectName() {
  return useSyncExternalStore(subscribe, current, none)
}
