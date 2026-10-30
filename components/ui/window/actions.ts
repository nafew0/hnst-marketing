import { returnToBase } from './history'
import { setMinimised, type WindowEntry } from './store'

function scrollerOf(href: string) {
  return document.querySelector<HTMLElement>(
    `[data-window-scroller][data-href="${href}"]`
  )
}

export function closeWindow() {
  returnToBase()
}

export function minimiseWindow({
  href,
  title,
}: Pick<WindowEntry, 'href' | 'title'>) {
  setMinimised({
    href,
    title,
    // oxlint-disable-next-line hamo/no-raw-layout-read -- one read on a click, in no loop
    scrollOffset: scrollerOf(href)?.scrollTop ?? 0,
    draft: null,
  })
  returnToBase()
}

export function focusWindow(href: string) {
  scrollerOf(href)?.focus({ preventScroll: true })
}
