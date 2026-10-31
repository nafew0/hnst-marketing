import { isGenieLeaving, stopGenie } from './genie'
import { returnToBase } from './history'
import { setMinimised, type WindowEntry } from './store'

function scrollerOf(href: string) {
  return document.querySelector<HTMLElement>(
    `[data-window-scroller][data-href="${href}"]`
  )
}

export function closeWindow() {
  if (isGenieLeaving()) return
  stopGenie()
  returnToBase()
}

export function minimiseWindow({
  href,
  title,
}: Pick<WindowEntry, 'href' | 'title'>) {
  setMinimised({ href, title, draft: null })
  returnToBase()
}

export function focusWindow(href: string) {
  scrollerOf(href)?.focus({ preventScroll: true })
}
