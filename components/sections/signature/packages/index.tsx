import {
  homePackages,
  packagesCopy,
} from '@/components/sections/signature/copy'
import { PackageReveal } from '@/components/sections/signature/package-reveal'
import { RevealHeading } from '@/components/sections/signature/reveal-heading'
import { Eyebrow } from '@/components/ui/heading'

import s from './packages.module.css'

/** S6 on the homepage: the heading and disclosure around `PackageReveal`. */
export function Packages() {
  return (
    <section className={s.section} aria-labelledby="packages-title">
      <div className="dr-layout-block flex flex-col dr-gap-32">
        <div className={s.intro}>
          <Eyebrow>{packagesCopy.eyebrow}</Eyebrow>
          <RevealHeading id="packages-title">
            {packagesCopy.heading}
          </RevealHeading>
        </div>
        <PackageReveal items={homePackages} />
        <div className="flex max-w-[72ch] flex-col dr-gap-8 caption text-silver">
          <p>{packagesCopy.toolCosts}</p>
          <p>{packagesCopy.terms}</p>
        </div>
      </div>
    </section>
  )
}
