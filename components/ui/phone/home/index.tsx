'use client'

import cn from 'clsx'
import { useLenis } from 'lenis/react'
import { type PointerEvent, useEffect, useRef } from 'react'

import { openPrivacyPreferences } from '@/components/forms/privacy'
import { Link } from '@/components/ui/link'
import { PhoneAppIcon } from '@/components/ui/window/dock-icons'
import { useMeasure } from '@/components/ui/window/genie'
import { useWindows } from '@/components/ui/window/store'
import { useDeviceDetection } from '@/hooks/use-device-detection'

import { HomeBar } from '../bars'
import type { PhoneContent } from '../load'
import { notify, setCentreOpen } from '../notifications/store'
import { appHref, useOpenApp } from '../open'
import { PHONE_APPS, type PhoneApp, socialNetworkOf } from '../registry'
import { showHome, syncLocked, usePhone } from '../store'
import { InstallWidget } from '../widgets/install'
import { NextCallWidget } from '../widgets/next-call'
import { useClock } from './clock'
import { LockScreen } from './lock'
import { Wallpaper } from './wallpaper'

import s from './home.module.css'

/** How long the home screen sits idle before `home-idle`. */
const IDLE_MS = 10_000
/** A pull that starts this close to the top is the phone's own gesture. */
const EDGE = 24
/** How far down a pull must travel to open the Notification Centre, in px. */
const PULL = 60

function Tile({ app }: { app: PhoneApp }) {
  const openApp = useOpenApp()
  const href = appHref(app)
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
      <PhoneAppIcon id={app.id} />
    </span>
  )

  // A button for the story, the classic site (M5) and apps kept in memory;
  // otherwise a real link, so it works before hydration too.
  if (!href || minimised)
    return (
      <button
        type="button"
        className={s.app}
        aria-label={app.name}
        onClick={() => openApp(app, measure())}
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
      onClick={(event) => {
        event.preventDefault()
        openApp(app, measure())
      }}
    >
      {icon}
      {label}
    </Link>
  )
}

function SocialTile({ app, url }: { app: PhoneApp; url: string }) {
  return (
    <Link
      href={url}
      className={s.app}
      aria-label={`${app.name} (opens in a new tab)`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className={s.icon}>
        <PhoneAppIcon id={app.id} />
      </span>
      <span className={s.label} aria-hidden="true">
        {app.label}
      </span>
    </Link>
  )
}

/** The top row: today's date, which opens the Notification Centre, and Privacy. */
function TopRow() {
  const clock = useClock()
  return (
    <div className={s.topRow}>
      {/* Named by what it shows, then what it opens. */}
      <button
        type="button"
        className={s.topButton}
        onClick={() => setCentreOpen(true)}
      >
        {clock?.short ?? ''}
        <span className="sr-only">
          {clock ? ', notifications' : 'Notifications'}
        </span>
      </button>
      <button
        type="button"
        className={s.topButton}
        aria-label="Privacy choices"
        onClick={openPrivacyPreferences}
      >
        Privacy
      </button>
    </div>
  )
}

/**
 * The phone's home screen, over the homepage story on `/` (docs/phases/M2.md).
 * Server-rendered and shown by CSS under the `dt:` breakpoint, so a phone sees
 * it on first paint; without JavaScript it is hidden and the story reads as
 * before. The lock screen sits on top once a session.
 */
export function PhoneHome({ content }: { content: PhoneContent }) {
  const { settings, socialLinks } = content
  const ref = useRef<HTMLDivElement>(null)
  const story = usePhone((state) => state.story)
  const locked = usePhone((state) => state.locked)
  const classic = usePhone((state) => state.classic)
  const windowOpen = useWindows((state) => state.activeHref !== null)
  const { isMobile } = useDeviceDetection()
  const lenis = useLenis()
  const pullFrom = useRef<number | null>(null)
  const phone = isMobile === true && !classic
  const covering = phone && !story && !windowOpen
  const homeUp = covering && locked === false
  const lockUp = settings.lockScreen && locked !== false

  useEffect(() => syncLocked(settings.lockScreen), [settings.lockScreen])

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

  useEffect(() => {
    if (!homeUp) return
    const timer = setTimeout(() => notify('home-idle'), IDLE_MS)
    return () => clearTimeout(timer)
  }, [homeUp])

  const socialUrl = (app: PhoneApp) =>
    app.opens.kind === 'social'
      ? socialLinks.find((link) => socialNetworkOf(link.url) === app.id)?.url
      : undefined
  const grid = PHONE_APPS.filter(
    (app) =>
      app.place === 'grid' && (app.opens.kind !== 'social' || socialUrl(app))
  )
  const dock = PHONE_APPS.filter((app) => app.place === 'dock')

  // Pull down from the top part of the home screen for the Notification Centre.
  const onPointerDown = (event: PointerEvent) => {
    pullFrom.current = event.clientY > EDGE ? event.clientY : null
  }
  const onPointerUp = (event: PointerEvent) => {
    if (pullFrom.current === null) return
    const travelled = event.clientY - pullFrom.current
    pullFrom.current = null
    if (travelled > PULL) setCentreOpen(true)
  }

  return (
    <>
      <div
        ref={ref}
        className={cn(s.home, 'mobile-only')}
        data-phone-home
        data-hidden={story || undefined}
        data-theme="dark"
      >
        <Wallpaper active={homeUp} />
        <div
          className={s.screenArea}
          inert={lockUp}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            pullFrom.current = null
          }}
        >
          <TopRow />
          <nav aria-label="Apps" className={s.screen}>
            <ul className={s.grid}>
              <li className={s.widgetCell}>
                <NextCallWidget copy={settings.widgets} active={homeUp} />
              </li>
              <li className={s.widgetCell}>
                <InstallWidget copy={settings.widgets} />
              </li>
              {grid.map((app) => {
                const url = socialUrl(app)
                return (
                  <li key={app.id}>
                    {url ? (
                      <SocialTile app={app} url={url} />
                    ) : (
                      <Tile app={app} />
                    )}
                  </li>
                )
              })}
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
        {lockUp && (
          <LockScreen
            cards={settings.notifications.filter(
              (item) => item.trigger === 'lock-first-visit' && item.enabled
            )}
            up={phone && locked === true && !windowOpen}
          />
        )}
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
