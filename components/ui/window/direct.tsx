'use client'

import cn from 'clsx'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import {
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'

import { openPrivacyPreferences } from '@/components/forms/privacy'
import { useDeviceTier } from '@/components/motion/device-tier'
import { HomeBar, PhoneAppBar } from '@/components/ui/phone/bars'
import { PHONE_LAYOUT } from '@/components/ui/phone/flag'
import { phoneTitle } from '@/components/ui/phone/registry'
import { worldHost, WorldSky } from '@/components/world'

import { TitleBar } from './controls'
import { captureDraft } from './drafts'
import { genieOut, useMeasure } from './genie'
import { setMinimised } from './store'

import s from './window.module.css'

interface DirectWindowProps {
  href: string
  title: string
  children: ReactNode
}

/**
 * A direct visit, refresh or crawler: the complete server-rendered page in the
 * window frame. Green fills the browser window with the frame, so the header
 * and footer behind it go inert.
 */
export function DirectWindow({ href, title, children }: DirectWindowProps) {
  const [fullscreen, setFullscreen] = useState(false)
  const frameRef = useRef<HTMLDivElement>(null)
  const [setMeasureRef, measure] = useMeasure()
  const { state: device } = useDeviceTier()
  const router = useRouter()

  useEffect(() => {
    setMeasureRef(frameRef.current)
  }, [setMeasureRef])

  useEffect(() => {
    if (!fullscreen) return
    const behind = document.querySelectorAll('header, footer')
    const root = document.documentElement
    for (const element of behind) element.setAttribute('inert', '')
    root.style.overflow = 'hidden'
    return () => {
      for (const element of behind) element.removeAttribute('inert')
      root.style.overflow = ''
    }
  }, [fullscreen])

  // Phone layout: back and home both go to the home screen with this page kept
  // in memory, as yellow does. Without JavaScript they are links to `/`.
  const homeKeepingPage = (event: MouseEvent) => {
    const element = frameRef.current
    if (!element) return
    event.preventDefault()
    setMinimised({ href, title, draft: captureDraft(element) })
    router.push('/' satisfies Route)
  }

  return (
    <div
      ref={frameRef}
      className={cn(s.direct, worldHost)}
      data-theme="dark"
      data-window-direct
      data-fullscreen={fullscreen || undefined}
      data-phone={PHONE_LAYOUT || undefined}
    >
      {PHONE_LAYOUT && (
        <PhoneAppBar
          className="mobile-only"
          title={phoneTitle(href, title)}
          href="/"
          onAction={homeKeepingPage}
          onPrivacy={openPrivacyPreferences}
        />
      )}
      {/* Hidden on phones in the phone layout; `contents` keeps it sticky. */}
      <div
        className={
          PHONE_LAYOUT ? cn('contents desktop-only', s.classicShow) : 'contents'
        }
      >
        <TitleBar
          home
          title={title}
          fullscreen={fullscreen}
          onToggleFullscreen={() => setFullscreen((value) => !value)}
          onMinimise={(event: MouseEvent) => {
            const element = frameRef.current
            if (!element) return
            // The link's own navigation would cut the genie short.
            if (device?.motionMedia) event.preventDefault()
            const draft = captureDraft(element)
            const settleHome = () => {
              setMinimised({ href, title, draft })
              router.push('/' satisfies Route)
            }
            if (device?.motionMedia)
              void genieOut({ element, measure }, href, settleHome)
            else setMinimised({ href, title, draft })
          }}
        />
      </div>
      {/* On a phone in the phone layout, the frame's scroller; elsewhere, nothing. */}
      <div className={s.directBody}>
        <WorldSky />
        {children}
      </div>
      {PHONE_LAYOUT && (
        <HomeBar className="mobile-only" href="/" onAction={homeKeepingPage} />
      )}
    </div>
  )
}
