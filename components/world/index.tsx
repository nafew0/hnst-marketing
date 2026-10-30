import cn from 'clsx'
import type { ComponentProps, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Eyebrow, Heading } from '@/components/ui/heading'
import { Image } from '@/components/ui/image'
import { Container } from '@/components/ui/section'

import { WorldScene } from './scene'
import type { WorldClip } from './worlds'

import s from './world.module.css'

export { worldFor, type WorldClip, type WorldScenes } from './worlds'

/** The class that turns a page's flat surfaces to glass over the starfield. */
export const worldHost = s.host

/** The nebula behind a whole page: it stays put while the content scrolls. */
export function WorldSky() {
  return (
    <div className={s.sky} aria-hidden="true">
      <Image src="/worlds/sky.webp" alt="" fill sizes="100vw" />
    </div>
  )
}

interface WorldHeroProps {
  clip: WorldClip
  title: string
  eyebrow?: string | null | undefined
  description?: string | null | undefined
  children?: ReactNode
}

/** The first screen: the page's world, with its headline over the horizon. */
export function WorldHero({
  clip,
  title,
  eyebrow,
  description,
  children,
}: WorldHeroProps) {
  return (
    <section className={s.hero}>
      <WorldScene clip={clip} priority />
      <div className={s.heroScrim} aria-hidden="true" />
      <Container className={s.heroCopy}>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Heading as="h1" size="h1">
          {title}
        </Heading>
        {description && <p className={cn(s.lede, 'p-big')}>{description}</p>}
        {children}
      </Container>
    </section>
  )
}

/** A wordless breath between sections: another world, fading in and out. */
export function WorldBand({ clip }: { clip: WorldClip }) {
  return (
    <div className={s.band}>
      <WorldScene clip={clip} />
    </div>
  )
}

interface WorldClosingProps extends ComponentProps<'section'> {
  clip: WorldClip
  title: string
  description?: string | null | undefined
  href: string
  label: string
}

/** The page's last call to action, at full width in its own world. */
export function WorldClosing({
  clip,
  title,
  description,
  href,
  label,
}: WorldClosingProps) {
  return (
    <section className={s.closing}>
      <WorldScene clip={clip} />
      <div className={s.closingScrim} aria-hidden="true" />
      <Container className={s.closingCopy}>
        <Heading>{title}</Heading>
        {description && <p className={cn(s.lede, 'p-big')}>{description}</p>}
        <Button href={href} size="lg">
          {label}
        </Button>
      </Container>
    </section>
  )
}
