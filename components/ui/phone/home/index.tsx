'use client'

import cn from 'clsx'
import { useLenis } from 'lenis/react'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import { DockIcon } from '@/components/ui/window/dock-icons'
import { useMeasure } from '@/components/ui/window/genie'
import {
  parkActive,
  setRestored,
  useWindows,
} from '@/components/ui/window/store'
import { useDeviceDetection } from '@/hooks/use-device-detection'

import { HomeBar } from '../bars'
import { PHONE_APPS, type PhoneApp, phoneOnlyHref } from '../registry'
import { launchFrom, openStory, showHome, usePhone } from '../store'

import s from './home.module.css'

/** Where an app's window lives, or null for apps that open no window. */
function hrefOf(app: PhoneApp) {
  if (app.opens.kind === 'route') return app.opens.href
  if (app.opens.kind === 'phone' && (app.id === 'camera' || app.id === 'notes'))
    return phoneOnlyHref(app.id)
  return null
}

/** The art for now: the dock's icons where a page has one (M2 draws the rest). */
function iconKey(app: PhoneApp) {
  if (app.opens.kind === 'story') return '/'
  return hrefOf(app) ?? `#${app.id}`
}

function Tile({ app }: { app: PhoneApp }) {
  const router = useRouter()
  const href = hrefOf(app)
  const [setMeasureRef, measure] = useMeasure()
  const minimised = useWindows((state) =>
    state.entries.some((entry) => entry.href === href && entry.minimised)
  )
  const label = app.place === 'grid' && (
    <span className={s.label} aria-hidden="true">
      {app.label}
    </span>
  )
  const icon = (
    <span ref={setMeasureRef} className={s.icon}>
      <DockIcon href={iconKey(app)} />
    </span>
  )

  // M5 builds the classic website; until then it opens the story too.
  if (app.opens.kind === 'story' || app.opens.kind === 'classic')
    return (
      <button
        type="button"
        className={s.app}
        aria-label={app.name}
        onClick={openStory}
      >
        {icon}
        {label}
      </button>
    )

  if (!href) return null

  if (minimised)
    return (
      <button
        type="button"
        className={s.app}
        aria-label={app.name}
        onClick={() => {
          launchFrom(href, measure())
          parkActive()
          setRestored(href)
          // SAFETY: `href` is a window this layer opened before.
          router.push(href as Route, { scroll: false })
        }}
      >
        {icon}
        {label}
      </button>
    )

  return (
    <Link
      href={href}
      className={s.app}
      aria-label={app.name}
      scroll={false}
      onClick={() => {
        launchFrom(href, measure())
        parkActive()
      }}
    >
      {icon}
      {label}
    </Link>
  )
}

/** Social apps wait for real handles (M2): none exist yet, so none show. */
const visible = (app: PhoneApp) => app.opens.kind !== 'social'

/**
 * The phone's home screen, over the homepage story on `/` (docs/phases/M1.md,
 * spike). Server-rendered and shown by CSS under the `dt:` breakpoint, so a
 * phone sees it on first paint; without JavaScript it is hidden and the story
 * reads as before.
 */
export function PhoneHome() {
  const ref = useRef<HTMLDivElement>(null)
  const story = usePhone((state) => state.story)
  const windowOpen = useWindows((state) => state.activeHref !== null)
  const { isMobile } = useDeviceDetection()
  const lenis = useLenis()
  const covering = isMobile === true && !story && !windowOpen

  // The story behind stays still and out of reach while the home screen
  // covers it. An open window does the same for itself (WindowHost).
  useEffect(() => {
    const home = ref.current
    if (!covering || !home) return
    const behind = [
      ...document.querySelectorAll('header, footer'),
      ...(home.parentElement ? [...home.parentElement.children] : []),
    ].filter((element) => element !== home)
    for (const element of behind) element.setAttribute('inert', '')
    lenis?.lock()
    const root = document.documentElement
    root.style.overflow = 'hidden'
    return () => {
      for (const element of behind) element.removeAttribute('inert')
      lenis?.unlock()
      root.style.overflow = ''
    }
  }, [covering, lenis])

  const grid = PHONE_APPS.filter((app) => app.place === 'grid' && visible(app))
  const dock = PHONE_APPS.filter((app) => app.place === 'dock')

  return (
    <>
      <div
        ref={ref}
        className={cn(s.home, 'mobile-only')}
        data-phone-home
        data-hidden={story || undefined}
        data-theme="dark"
      >
        <div className={s.wallpaper} aria-hidden="true">
          <Image
            src="/worlds/lunar-walk.webp"
            alt=""
            fill
            mobileSize="100vw"
            desktopSize="1vw"
            objectFit="cover"
            className={s.wallpaperImage}
          />
        </div>
        <nav aria-label="Apps" className={s.screen}>
          <ul className={s.grid}>
            {grid.map((app) => (
              <li key={app.id}>
                <Tile app={app} />
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Dock" className={s.dockArea}>
          <ul className={s.dock}>
            {dock.map((app) => (
              <li key={app.id}>
                <Tile app={app} />
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {story && (
        <HomeBar
          className={cn(s.storyHome, 'mobile-only')}
          onAction={showHome}
        />
      )}
    </>
  )
}
