import { proofCopy } from '@/components/sections/signature/copy'
import { RevealHeading } from '@/components/sections/signature/reveal-heading'
import { Button } from '@/components/ui/button'
import { Eyebrow, Heading } from '@/components/ui/heading'
import { HorizonDivider } from '@/components/ui/horizon-divider'

import { ProofFrame } from './proof-frame'

import s from './proof-booking.module.css'

/**
 * S7. Client-zero screens in a device frame that scroll as the frame is pinned;
 * under reduced motion and on phones they lay out as a static gallery. Then the
 * closing band with the one gold booking button.
 */
export function ProofBooking() {
  const { eyebrow, heading, body, shots, ctaHeading, cta } = proofCopy
  return (
    <>
      <section className={s.proof} aria-labelledby="proof-title">
        <ProofFrame
          shots={shots}
          intro={
            <div className={s.intro}>
              <Eyebrow>{eyebrow}</Eyebrow>
              <RevealHeading id="proof-title">{heading}</RevealHeading>
              <p className="p-big text-pretty text-silver">{body}</p>
            </div>
          }
        />
      </section>

      <section className={s.band} aria-labelledby="cta-title">
        <HorizonDivider className={s.horizon} />
        <div className="dr-layout-block">
          <div className={s.bandInner}>
            <Heading id="cta-title" size="h1">
              {ctaHeading}
            </Heading>
            <Button href={cta.href} size="lg">
              {cta.label}
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
