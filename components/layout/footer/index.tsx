import cn from 'clsx'

import { Button } from '@/components/ui/button'
import { HorizonDivider } from '@/components/ui/horizon-divider'
import { Link } from '@/components/ui/link'
import { Logo } from '@/components/ui/logo'
import { bookCall, footerNav, legalNav } from '@/lib/navigation'

import s from './footer.module.css'

// Module scope keeps render pure. Server and client agree except across a
// New Year between build and visit, which suppressHydrationWarning covers.
const YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className={s.footer} data-theme="dark">
      <HorizonDivider className={s.horizon} />
      <div className={cn(s.inner, 'dr-layout-block')}>
        <div className={s.brand}>
          <Link href="/" aria-label="HONEST Marketing home" className={s.home}>
            <Logo title={false} className={s.logo} />
          </Link>
          {/* Outside the link: visible text inside it must be part of the
              link's accessible name (axe label-content-name-mismatch). */}
          <p className="eyebrow text-silver uppercase">
            Powered by HONEST SuperIntelligence
          </p>
          <p className="max-w-[28ch] p-big text-pretty text-silver">
            Complete marketing packages, produced with AI and reviewed by
            people.
          </p>
          <Button href={bookCall.href}>{bookCall.label}</Button>
        </div>

        <nav aria-label="Footer" className={s.columns}>
          <ul className={s.list}>
            {footerNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={cn(s.link, 'link uppercase')}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className={s.list}>
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={cn(s.link, 'link uppercase')}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p
        className={cn(s.legal, 'dr-layout-block caption text-silver')}
        suppressHydrationWarning
      >
        © {YEAR} HONEST Marketing, a DBA of Honest Media Group.
      </p>
    </footer>
  )
}
