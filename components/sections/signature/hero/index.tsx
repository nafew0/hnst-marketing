import cn from 'clsx'

import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { bookCall } from '@/lib/navigation'

import s from './hero.module.css'

// DRAFT copy for v0 (P1). Final copy is Nafew's input (docs/PLAN.md § 6);
// P7 replaces this section with the cinematic S1.
const HEADLINE_LINES = ['Your whole marketing', 'package. Done honestly.']

/**
 * Hero v0: static nebula (CSS gradients from the brand tokens), the gold
 * mark, a line-by-line headline rise and two CTAs. The entrance is pure CSS
 * and starts with the first paint: the server-rendered headline is the LCP
 * element, so it is never hidden waiting for JavaScript (see the keyframes'
 * comment in hero.module.css). Reduced motion shows the final state.
 */
export function Hero() {
  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <div className={s.sky} aria-hidden="true">
        <div className={s.stars} />
        <div className={s.planet} />
        <div className={s.flare} />
      </div>

      <div className={cn(s.content, 'dr-layout-block')}>
        <Logo tagline className={s.logo} />
        <h1 id="hero-title" className={cn(s.headline, 'h1')}>
          {HEADLINE_LINES.map((line) => (
            <span key={line} className={s.line}>
              <span className={s.lineInner}>{line}</span>
            </span>
          ))}
        </h1>
        <p className={cn(s.lede, 'p-big text-pretty')}>
          Brand, research, campaign, website, email and 30 days of content,
          produced with AI and reviewed by people. Delivered in days, not
          months.
        </p>
        <div className={s.ctas}>
          <Button href={bookCall.href} size="lg">
            {bookCall.label}
          </Button>
          <Button href="/packages" variant="ghost" size="lg">
            See packages
          </Button>
        </div>
      </div>
    </section>
  )
}
