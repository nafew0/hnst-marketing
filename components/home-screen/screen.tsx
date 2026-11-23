'use client'

import { useLenis } from 'lenis/react'
import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import { openPrivacyPreferences } from '@/components/forms/privacy'
import { useProspectName } from '@/components/prospects/store'
import { Link } from '@/components/ui/link'
import { useWindows } from '@/components/ui/window/store'
import { WorldScene } from '@/components/world/scene'

import { HOMEPAGE_HREF, type HomeScreenCopy, type HomeScreenLink } from './copy'
import { type Experience, HomeLock, UNLOCKED_ATTRIBUTE } from './lock'
import { Widget } from './widgets'

import s from './home-screen.module.css'

const noChange = () => () => undefined
const unlockedHere = () =>
  document.documentElement.hasAttribute(UNLOCKED_ATTRIBUTE)
const lockedOnServer = () => false

function IconLink({
  link,
  onHomepage,
  children,
}: {
  link: HomeScreenLink
  onHomepage: () => void
  children: ReactNode
}) {
  if (link.href === HOMEPAGE_HREF)
    return (
      <button type="button" className={s.icon} onClick={onHomepage}>
        {children}
      </button>
    )
  return (
    <Link href={link.href} className={s.icon}>
      {children}
    </Link>
  )
}

/**
 * The first screen on `/` while the CMS's home screen is on (Dylan's layout,
 * 20–21 Nov 2026): the lock screen's audit question, then four widgets over a
 * looping scene, square app icons, and the Call / Text / Email dock (ContactBar,
 * in the site layout). It covers the cinematic homepage, which "Home page"
 * reveals; a pill at the top comes back. Server-rendered: the first paint.
 */
export function HomeScreen({ copy }: { copy: HomeScreenCopy }) {
  const ref = useRef<HTMLDivElement>(null)
  const [homepage, setHomepage] = useState(false)
  const [picked, setPicked] = useState(false)
  // Unlocked earlier this visit, or arrived elsewhere: the layout's script said so.
  const unlockedBefore = useSyncExternalStore(
    noChange,
    unlockedHere,
    lockedOnServer
  )
  const locked = copy.lock.enabled && !picked && !unlockedBefore
  const windowOpen = useWindows((state) => state.activeHref !== null)
  const lenis = useLenis()
  const prospect = useProspectName()
  const covering = !homepage && !windowOpen

  // The dock drops to the edge while the screen covers the corner pills.
  useEffect(() => {
    if (!covering) return
    const root = document.documentElement
    root.setAttribute('data-home-covering', '')
    return () => root.removeAttribute('data-home-covering')
  }, [covering])

  // The homepage behind stays still and out of reach while the screen covers it.
  useEffect(() => {
    const screen = ref.current
    if (!covering || !screen) return
    const behind = [
      ...document.querySelectorAll('header, footer'),
      ...(screen.parentElement ? [...screen.parentElement.children] : []),
    ].filter((element) => element !== screen && !element.contains(screen))
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

  const showHomepage = () => {
    setHomepage(true)
    void lenis?.scrollTo(0, { immediate: true })
  }

  const pick = (experience: Experience) => {
    setPicked(true)
    if (experience === 'browse') showHomepage()
    else
      ref.current
        ?.querySelector<HTMLElement>('[data-home-widgets] a')
        ?.focus({ preventScroll: true })
  }

  return (
    <>
      <div
        ref={ref}
        className={s.screen}
        data-home-screen-layer
        data-hidden={homepage || undefined}
        inert={homepage}
        data-theme="dark"
      >
        <div className={s.backdrop}>
          <WorldScene clip={copy.background} priority />
        </div>
        <div className={s.content} inert={locked}>
          <h1 className="sr-only">{copy.title}</h1>
          {/* The screen covers the corner Privacy pill, so consent stays reachable here. */}
          <div className={s.topRow}>
            <p className={s.greeting} role="status">
              {prospect ? copy.greeting.replaceAll('{name}', prospect) : ''}
            </p>
            <button
              type="button"
              className={s.topButton}
              aria-label="Privacy choices"
              onClick={openPrivacyPreferences}
            >
              Privacy
            </button>
          </div>
          <nav aria-label="Offers" className="contents">
            <ul className={s.widgets} data-home-widgets>
              {copy.buttons.map((widget, order) => (
                <li key={`${widget.label}${widget.href}`}>
                  <Widget
                    widget={widget}
                    order={order}
                    playing={covering && !locked}
                  />
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="More">
            <ul className={s.icons}>
              {copy.links.map((link) => (
                <li key={`${link.label}${link.href}`}>
                  <IconLink link={link} onHomepage={showHomepage}>
                    {link.label}
                  </IconLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        {locked && <HomeLock copy={copy.lock} onPick={pick} />}
      </div>
      {homepage && !windowOpen && (
        <div className={s.back} data-theme="dark">
          <button
            type="button"
            className={s.backButton}
            onClick={() => setHomepage(false)}
          >
            {copy.backLabel}
          </button>
        </div>
      )}
    </>
  )
}
