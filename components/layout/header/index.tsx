'use client'

import cn from 'clsx'
import { useWindowSize } from 'hamo'
import { useLenis } from 'lenis/react'
import { usePathname } from 'next/navigation'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Logo } from '@/components/ui/logo'
import { bookCall } from '@/lib/navigation'

import s from './header.module.css'

/** Scroll past this share of the viewport on the homepage's hero, then solid. */
const HERO_SHARE = 0.8
/** Every other page goes solid as soon as anything has scrolled under the bar. */
const PAGE_OFFSET = 24

/** Fixed top bar: the logo, plus "Book a call" on desktop. The dock is the site's menu. */
export function Header() {
  const pathname = usePathname()
  const headerRef = useRef<HTMLElement>(null)
  const { height = 0 } = useWindowSize()
  const solidFrom = pathname === '/' ? height * HERO_SHARE : PAGE_OFFSET

  // Through a ref: the state flips on scroll, which never re-renders the bar.
  useLenis(
    ({ scroll }) => {
      headerRef.current?.toggleAttribute('data-solid', scroll > solidFrom)
    },
    [solidFrom]
  )

  return (
    // Only the homepage has Lenis and a hero to keep clear; elsewhere it's solid.
    <header
      ref={headerRef}
      className={s.header}
      data-solid={pathname === '/' ? undefined : ''}
    >
      <div className={cn(s.bar, 'dr-layout-block')}>
        <Link href="/" aria-label="HONEST Marketing home" className={s.home}>
          <Logo title={false} className={s.logo} />
        </Link>

        <div className="desktop-only">
          <Button href={bookCall.href}>{bookCall.label}</Button>
        </div>
      </div>
    </header>
  )
}
