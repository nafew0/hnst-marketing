import cn from 'clsx'

import { heroCopy } from '@/components/sections/signature/copy'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/heading'
import { Logo } from '@/components/ui/logo'

import { HeroStage } from './hero-stage'

import s from './hero.module.css'

/**
 * S1. The headline is server-rendered and rises with CSS on first paint, so it
 * is the LCP element and never waits for JavaScript (see the keyframes' comment
 * in hero.module.css). Behind it, `HeroStage` holds the code-rendered poster
 * and, at tiers 2–3, the live gas, stars and planet. Reduced motion shows the
 * final state.
 */
export function Hero() {
  const { eyebrow, lines, lede, primaryCta, secondaryCta } = heroCopy
  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <HeroStage />

      {/* The Brand Bible logo in its own colours, with depth from CSS: a stacked
          extrusion, a light sweep and a tilt towards the pointer. */}
      <div className={s.emblem} aria-hidden="true">
        <div className={s.emblemGlow} />
        <div className={s.emblemTilt}>
          <Logo tagline title={false} className={s.emblemLogo} />
          <Logo tagline title={false} className={s.emblemSheen} />
        </div>
      </div>

      <div className={cn(s.content, 'dr-layout-block')}>
        <Eyebrow className={s.eyebrow}>{eyebrow}</Eyebrow>
        <h1 id="hero-title" className={cn(s.headline, 'h1')}>
          {lines.map((line) => (
            <span key={line} className={s.line}>
              <span className={s.lineInner}>{line}</span>
            </span>
          ))}
        </h1>
        <p className={cn(s.lede, 'p-big text-pretty')}>{lede}</p>
        <div className={s.ctas}>
          <Button href={primaryCta.href} size="lg">
            {primaryCta.label}
          </Button>
          <Button href={secondaryCta.href} variant="ghost" size="lg">
            {secondaryCta.label}
          </Button>
        </div>
      </div>
    </section>
  )
}
