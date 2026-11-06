'use client'

import type { Route } from 'next'
import { usePathname, useRouter } from 'next/navigation'
import { useSyncExternalStore } from 'react'

import { leaveClassic } from './store'

import s from './classic.module.css'

const noChange = () => () => undefined
const hostHere = () => location.host
const noHostOnServer = () => null

/**
 * The classic website's address bar (docs/phases/M5.md): the page's URL, and
 * a pill back to the phone's home screen. Only while the classic site is on.
 */
export function ClassicBar() {
  const pathname = usePathname()
  const router = useRouter()
  const host = useSyncExternalStore(noChange, hostHere, noHostOnServer)
  return (
    <div className={s.bar} data-theme="dark">
      <p className={s.address}>
        <svg viewBox="0 0 10 12" aria-hidden="true" focusable="false">
          <path d="M2.5 5V3.5a2.5 2.5 0 0 1 5 0V5M1.5 5h7v6h-7z" />
        </svg>
        <span className="sr-only">Address: </span>
        {host ?? ''}
        {pathname === '/' ? '' : pathname}
      </p>
      <button
        type="button"
        className={s.pill}
        onClick={() => {
          leaveClassic()
          router.push('/' satisfies Route)
        }}
      >
        Home screen
      </button>
    </div>
  )
}
