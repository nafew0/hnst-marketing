'use client'

import cn from 'clsx'
import { useWindowSize } from 'hamo'
import { useLenis } from 'lenis/react'
import { usePathname } from 'next/navigation'
import { type ComponentType, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Logo } from '@/components/ui/logo'
import { useDeviceDetection } from '@/hooks/use-device-detection'
import { bookCall, primaryNav } from '@/lib/navigation'

import type { MobileMenuProps } from './mobile-menu'

import s from './header.module.css'

/**
 * The drawer's Base UI code is 23 KB gzipped, and only phones use it: it loads
 * after hydration, on mobile widths, so it stays out of every page's first load.
 */
const loadMenu = () => import('./mobile-menu').then((mod) => mod.MobileMenu)

/** Scroll past this share of the viewport on the homepage's hero, then solid. */
const HERO_SHARE = 0.8
/** Every other page goes solid as soon as anything has scrolled under the bar. */
const PAGE_OFFSET = 24

/** Fixed top bar. Desktop: inline nav + gold "Book a call". Mobile: a drawer. */
export function Header() {
  const pathname = usePathname()
  const { isDesktop } = useDeviceDetection()
  const [Menu, setMenu] = useState<ComponentType<MobileMenuProps> | null>(null)
  // A tap before the drawer's code arrives still opens it when it does.
  const [tappedEarly, setTappedEarly] = useState(false)

  useEffect(() => {
    if (isDesktop !== false) return
    let cancelled = false
    void loadMenu().then((component) => {
      if (!cancelled) setMenu(() => component)
    })
    return () => {
      cancelled = true
    }
  }, [isDesktop])

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
    <header ref={headerRef} className={s.header}>
      <div className={cn(s.bar, 'dr-layout-block')}>
        <Link href="/" aria-label="HONEST Marketing home" className={s.home}>
          <Logo title={false} className={s.logo} />
        </Link>

        <nav aria-label="Primary" className="desktop-only">
          <ul className={s.navList}>
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  className={cn(s.navLink, 'link uppercase')}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="desktop-only">
          <Button href={bookCall.href}>{bookCall.label}</Button>
        </div>

        {Menu ? (
          <Menu pathname={pathname} defaultOpen={tappedEarly} />
        ) : (
          <button
            type="button"
            aria-label="Open menu"
            className={cn(s.menuToggle, 'mobile-only link uppercase')}
            onClick={() => setTappedEarly(true)}
          >
            Menu
          </button>
        )}
      </div>
    </header>
  )
}
