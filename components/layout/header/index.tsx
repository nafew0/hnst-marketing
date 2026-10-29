'use client'

import { Dialog } from '@base-ui/react/dialog'
import cn from 'clsx'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Logo } from '@/components/ui/logo'
import { bookCall, primaryNav } from '@/lib/navigation'

import s from './header.module.css'

/**
 * Fixed top bar. Desktop: inline nav + gold "Book a call". Mobile: a
 * full-screen drawer on Base UI Dialog (focus trap, Escape, scroll lock,
 * focus returns to the toggle). The drawer closes on navigation.
 */
export function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPath, setMenuPath] = useState(pathname)
  // Close on route change, during render (no effect needed).
  if (pathname !== menuPath) {
    setMenuPath(pathname)
    setMenuOpen(false)
  }

  return (
    <header className={s.header}>
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

        <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Dialog.Trigger
            aria-label="Open menu"
            className={cn(s.menuToggle, 'mobile-only link uppercase')}
          >
            Menu
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className={s.backdrop} />
            <Dialog.Popup className={s.drawer} data-theme="dark">
              <div className={s.drawerTop}>
                <Dialog.Title className="sr-only">Menu</Dialog.Title>
                <Logo title="HONEST Marketing" className={s.logo} />
                <Dialog.Close
                  aria-label="Close menu"
                  className={cn(s.menuToggle, 'link uppercase')}
                >
                  Close
                </Dialog.Close>
              </div>
              <nav aria-label="Primary">
                <ul className={s.drawerList}>
                  {primaryNav.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={
                          pathname === item.href ? 'page' : undefined
                        }
                        className={cn(s.drawerLink, 'h2')}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <Button href={bookCall.href} size="lg" className="w-full">
                {bookCall.label}
              </Button>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  )
}
