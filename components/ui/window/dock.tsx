'use client'

import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import { dismissMinimised, setRestored, useWindows } from './store'

import s from './window.module.css'

/** One chip per minimised window. Shown only while no window is open. */
export function WindowDock() {
  const entries = useWindows((state) => state.entries)
  const router = useRouter()
  return (
    <nav aria-label="Minimised windows" className={s.dock}>
      {entries
        .filter((entry) => entry.minimised)
        .map(({ href, title }) => (
          <div key={href} className={s.chip}>
            <button
              type="button"
              className={s.restore}
              aria-label={`Restore ${title}`}
              onClick={() => {
                setRestored(href)
                // SAFETY: `href` is the pathname of a page that rendered a window.
                router.push(href as Route, { scroll: false })
              }}
            >
              <span aria-hidden="true" className={s.chipDot} />
              <span className={s.chipTitle}>{title}</span>
            </button>
            <button
              type="button"
              className={s.dismiss}
              aria-label={`Dismiss ${title}`}
              onClick={() => dismissMinimised(href)}
            >
              <svg
                viewBox="0 0 10 10"
                aria-hidden="true"
                focusable="false"
                className={s.glyph}
              >
                <path d="M2.5 2.5l5 5m0-5l-5 5" />
              </svg>
            </button>
          </div>
        ))}
    </nav>
  )
}
