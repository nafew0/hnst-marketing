'use client'

import type { Route } from 'next'
import { usePathname, useRouter } from 'next/navigation'
import { type MouseEvent, type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

import { useDeviceTier } from '@/components/motion/device-tier'
import { Link } from '@/components/ui/link'
import type { SiteLinks } from '@/components/ui/phone/load'
import {
  contactDetail,
  contactHref,
  PHONE_LINKS,
  phoneApp,
  SOCIAL_NETWORKS,
} from '@/components/ui/phone/registry'
import { bookCall, footerNav } from '@/lib/navigation'

import { focusWindow } from './actions'
import { ContactLinkIcon, DockIcon, SocialMark } from './dock-icons'
import { genieIn, registerTile, registerViewport, useMeasure } from './genie'
import {
  dismissMinimised,
  parkActive,
  setRestored,
  useWindows,
  type WindowEntry,
} from './store'

import s from './dock.module.css'

const APPS = [{ href: '/', label: 'Home' }, ...footerNav, bookCall].map(
  ({ href, label }) => ({ href, label })
)

const APP_HREFS = new Set(APPS.map((app) => app.href))

interface TileProps {
  href: string
  label: string
  entry: WindowEntry | undefined
  onSite: boolean
}

function Tile({ href, label, entry, onSite }: TileProps) {
  const router = useRouter()
  const { state: device } = useDeviceTier()
  const active = useWindows((state) => state.activeHref === href)
  const [setMeasureRef, measure] = useMeasure()

  useEffect(() => registerTile(href, measure), [href, measure])

  const minimised = entry?.minimised === true
  const onOpen = (event: MouseEvent) => {
    if (active) {
      event.preventDefault()
      focusWindow(href)
      return
    }
    parkActive()
  }

  return (
    <li
      ref={setMeasureRef}
      className={s.tile}
      data-dock-tile={href}
      data-running={entry || onSite ? '' : undefined}
    >
      {minimised ? (
        <button
          type="button"
          className={s.app}
          aria-label={`Restore ${entry.title || label}`}
          onClick={() => {
            parkActive()
            setRestored(href)
            if (device?.motionMedia) genieIn(href)
            // SAFETY: `href` is the pathname of a page that rendered a window.
            router.push(href as Route, { scroll: false })
          }}
        >
          <DockIcon href={href} />
        </button>
      ) : (
        <Link
          href={href}
          className={s.app}
          aria-label={label}
          aria-current={active ? 'page' : undefined}
          onClick={onOpen}
        >
          <DockIcon href={href} />
        </Link>
      )}
      <span aria-hidden="true" className={s.label}>
        {entry?.title || label}
      </span>
      <span aria-hidden="true" className={s.running} />
      {minimised && (
        <button
          type="button"
          className={s.dismiss}
          aria-label={`Dismiss ${entry.title || label}`}
          onClick={() => dismissMinimised(href)}
        >
          <svg
            viewBox="0 0 10 10"
            aria-hidden="true"
            focusable="false"
            className={s.dismissGlyph}
          >
            <path d="M2.5 2.5l5 5m0-5l-5 5" />
          </svg>
        </button>
      )}
    </li>
  )
}

interface LinkTileProps {
  href: string
  /** Over the icon on hover. */
  label: string
  /** The accessible name. */
  name: string
  icon: ReactNode
}

/**
 * A way out of the site: the visitor's own Phone, Messages and Mail, or
 * HONEST on a social network (a new tab, as `Link` does for http links).
 */
function LinkTile({ href, label, name, icon }: LinkTileProps) {
  return (
    <li className={s.tile} data-dock-link>
      <Link href={href} className={s.app} aria-label={name}>
        {icon}
      </Link>
      <span aria-hidden="true" className={s.label}>
        {label}
      </span>
    </li>
  )
}

/**
 * The site's dock: one app icon per main page; after a divider, the visitor's
 * own Phone, Messages and Mail and HONEST's social profiles; and one more for
 * anything else open, such as a package tier. A portal on `body`, so it stays
 * usable above a window while everything else behind one is inert.
 */
export function WindowDock({ links }: { links: SiteLinks }) {
  const entries = useWindows((state) => state.entries)
  const open = useWindows((state) => state.activeHref !== null)
  const pathname = usePathname()
  const [setViewportRef, measureViewport] = useMeasure()

  useEffect(() => registerViewport(measureViewport), [measureViewport])

  const entryOf = (href: string) => entries.find((entry) => entry.href === href)
  const others = entries.filter((entry) => !APP_HREFS.has(entry.href))

  return createPortal(
    <>
      <div ref={setViewportRef} aria-hidden="true" className={s.viewport} />
      <nav
        aria-label="Dock"
        className={s.dock}
        data-window-dock
        data-theme="dark"
        data-open={open || undefined}
      >
        <ul className={s.bar}>
          {APPS.map(({ href, label }) => (
            <Tile
              key={href}
              href={href}
              label={label}
              entry={entryOf(href)}
              onSite={href !== '/' && pathname === href}
            />
          ))}
          <li aria-hidden="true" className={s.divider} />
          {PHONE_LINKS.map((link) => (
            <LinkTile
              key={link.id}
              href={contactHref(link.channel, links.contact)}
              label={link.label}
              name={`${link.name}: ${contactDetail(link.channel, links.contact)}`}
              icon={<ContactLinkIcon id={link.id} />}
            />
          ))}
          {SOCIAL_NETWORKS.map((network) => (
            <LinkTile
              key={network}
              href={links.social[network]}
              label={phoneApp(network).label}
              name={`${phoneApp(network).name} (opens in a new tab)`}
              icon={<SocialMark network={network} sizes="62px" />}
            />
          ))}
          {others.length > 0 && <li aria-hidden="true" className={s.divider} />}
          {others.map((entry) => (
            <Tile
              key={entry.href}
              href={entry.href}
              label={entry.title}
              entry={entry}
              onSite={false}
            />
          ))}
        </ul>
      </nav>
    </>,
    document.body
  )
}
