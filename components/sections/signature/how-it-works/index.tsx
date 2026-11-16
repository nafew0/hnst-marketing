import type { HomeCopy } from '@/components/sections/signature/home-copy'
import { RevealHeading } from '@/components/sections/signature/reveal-heading'

import { StepsArc } from './steps-arc'

import s from './how-it-works.module.css'

/**
 * S5. All five steps are lit in the HTML and under reduced motion; with motion
 * the arc draws with scroll and lights them in turn. The CMS's Homepage global
 * edits the steps (home-copy.ts).
 */
export function HowItWorks({ copy }: { copy: HomeCopy['steps'] }) {
  return (
    <section className={s.section} aria-labelledby="steps-title">
      <StepsArc
        steps={copy.items}
        note={copy.note}
        intro={
          <div className={s.intro}>
            <RevealHeading id="steps-title">{copy.heading}</RevealHeading>
          </div>
        }
      />
    </section>
  )
}
