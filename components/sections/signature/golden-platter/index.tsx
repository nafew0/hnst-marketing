import cn from 'clsx'

import { platterCopy } from '@/components/sections/signature/copy'
import { RevealHeading } from '@/components/sections/signature/reveal-heading'
import { Eyebrow } from '@/components/ui/heading'

import { PlatterStage } from './platter-stage'

import s from './golden-platter.module.css'

/**
 * S4. The deliverables are a real list in the HTML: at tiers 0–1 it sits beside
 * the rendered still, and at tiers 2–3 its items become captions that follow
 * the props on the platter (`PlatterStage`).
 */
export function GoldenPlatter() {
  const { eyebrow, heading, body, note, deliverables } = platterCopy
  return (
    <section className={s.section} aria-labelledby="platter-title">
      <PlatterStage
        intro={
          <div className="dr-layout-block">
            <div className={s.intro}>
              <Eyebrow>{eyebrow}</Eyebrow>
              <RevealHeading id="platter-title" className={cn(s.heading)}>
                {heading}
              </RevealHeading>
              <p className="p-big text-pretty text-silver">{body}</p>
            </div>
          </div>
        }
        deliverables={deliverables}
        note={note}
      />
    </section>
  )
}
