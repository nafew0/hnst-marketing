import {
  type ProcessStep,
  fallbackSteps,
  stepsCopy,
} from '@/components/sections/signature/copy'
import { RevealHeading } from '@/components/sections/signature/reveal-heading'
import { Eyebrow } from '@/components/ui/heading'

import { StepsArc } from './steps-arc'

import s from './how-it-works.module.css'

/**
 * S5. All five steps are lit in the HTML and under reduced motion; with motion
 * the arc draws with scroll and lights them in turn. Takes `steps` so the CMS
 * can feed it once P3 is merged.
 */
export function HowItWorks({
  steps = fallbackSteps,
}: {
  steps?: readonly ProcessStep[]
}) {
  return (
    <section className={s.section} aria-labelledby="steps-title">
      <StepsArc
        steps={steps}
        intro={
          <div className={s.intro}>
            <Eyebrow>{stepsCopy.eyebrow}</Eyebrow>
            <RevealHeading id="steps-title">{stepsCopy.heading}</RevealHeading>
          </div>
        }
      />
    </section>
  )
}
