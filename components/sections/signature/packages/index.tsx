import type { HomeCopy } from '@/components/sections/signature/home-copy'
import { PackageReveal } from '@/components/sections/signature/package-reveal'
import { RevealHeading } from '@/components/sections/signature/reveal-heading'
import { Eyebrow } from '@/components/ui/heading'

import s from './packages.module.css'

/** S6 on the homepage: the heading and disclosure around `PackageReveal`. */
export function Packages({ copy }: { copy: HomeCopy['packages'] }) {
  return (
    <section className={s.section} aria-labelledby="packages-title">
      <div className="dr-layout-block flex flex-col dr-gap-32">
        <div className={s.intro}>
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <RevealHeading id="packages-title">{copy.heading}</RevealHeading>
        </div>
        <PackageReveal items={copy.items} />
        <div className="flex max-w-[72ch] flex-col dr-gap-8 caption text-silver">
          <p>{copy.toolCosts}</p>
          <p>{copy.terms}</p>
        </div>
      </div>
    </section>
  )
}
