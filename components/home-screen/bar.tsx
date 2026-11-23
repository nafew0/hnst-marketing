'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

import { Link } from '@/components/ui/link'
import type { PhoneLink, SiteContact } from '@/components/ui/phone/registry'
import { syncClassic } from '@/components/ui/phone/store'
import { ContactLinkIcon } from '@/components/ui/window/dock-icons'
import { useWindows } from '@/components/ui/window/store'

import {
  type ContactKind,
  contactLink,
  type PageTitle,
  pageName,
} from './contact'
import type { HomeScreenCopy } from './copy'

import s from './home-screen.module.css'

/** The visitor's own Phone, Messages and Mail, drawn as on a phone's dock. */
const ICONS = {
  call: 'phone',
  text: 'messages',
  email: 'email',
} as const satisfies Record<Exclude<ContactKind, 'price'>, PhoneLink['id']>

const noChange = () => () => undefined
const onClient = () => true
const onServer = () => false

/**
 * Call, Text and Email, at the bottom of every page while the home screen is
 * on: the only way to act on this site (21 Nov 2026). Each opens the visitor's
 * own app with the message written for the page they're on. On <body> and
 * exempt from a window's inert pass, as the dock was.
 */
export function ContactBar({
  bar,
  contact,
  titles,
}: {
  bar: HomeScreenCopy['bar']
  contact: SiteContact
  titles: readonly PageTitle[]
}) {
  const pathname = usePathname()
  const mounted = useSyncExternalStore(noChange, onClient, onServer)
  const windowOpen = useWindows((state) => state.activeHref !== null)
  const page = pageName(pathname, titles)

  // The phone layout reads the classic flag the server set (layout.tsx), so
  // pages open as plain windows and show their full content, not phone apps.
  useEffect(() => syncClassic(), [])

  const label = {
    call: bar.call,
    text: bar.text,
    email: bar.email,
  } satisfies Record<Exclude<ContactKind, 'price'>, string>
  const nav = (
    <nav
      aria-label="Contact Dylan"
      className={s.bar}
      data-window-dock
      data-low={windowOpen || undefined}
      data-theme="dark"
    >
      {(['call', 'text', 'email'] as const).map((kind) => (
        <Link
          key={kind}
          href={contactLink(kind, page, contact, bar)}
          className={s.barLink}
          aria-label={label[kind]}
          title={label[kind]}
        >
          <ContactLinkIcon id={ICONS[kind]} />
        </Link>
      ))}
    </nav>
  )
  // In place for the first paint (and without JavaScript); then on <body>.
  return mounted ? createPortal(nav, document.body) : nav
}
