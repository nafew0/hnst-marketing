'use client'

import { useRef } from 'react'

import {
  useDeviceTier,
  useDrawPath,
  useScrollLinked,
  useScrollProgress,
  useSplitReveal,
} from '@/components/motion'
import { Eyebrow, Heading } from '@/components/ui/heading'
import { HorizonDivider } from '@/components/ui/horizon-divider'
import { Container, Section } from '@/components/ui/section'

export function LabMotion() {
  const { state, meta } = useDeviceTier()

  const headlineRef = useRef<HTMLHeadingElement>(null)
  useSplitReveal(headlineRef, { onScroll: true })

  const arcRef = useRef<SVGSVGElement>(null)
  useDrawPath(arcRef, { scrub: true })

  const driftRef = useRef<HTMLDivElement>(null)
  useScrollLinked(driftRef, () => ({ x: ['-30%', '30%'], rotate: [-8, 8] }))

  const barRef = useRef<HTMLDivElement>(null)
  const setProgressRef = useScrollProgress((progress) => {
    if (barRef.current) {
      barRef.current.style.transform = `scaleX(${progress.toFixed(3)})`
    }
  })

  return (
    <Section aria-labelledby="lab-motion" className="overflow-clip">
      <Container className="flex flex-col dr-gap-40">
        <Heading id="lab-motion">Motion</Heading>

        <dl className="grid grid-cols-2 dr-gap-16 dt:grid-cols-5">
          {[
            ['Tier', meta.ready ? String(state?.tier) : 'detecting…'],
            ['Reason', state?.reason ?? '…'],
            ['Live WebGL', state ? String(state.liveWebGL) : '…'],
            ['Bloom', state ? String(state.bloom) : '…'],
            ['Max DPR', state ? String(state.maxDpr) : '…'],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col dr-gap-4">
              <dt className="eyebrow text-contrast uppercase">{label}</dt>
              <dd className="p">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col dr-gap-8">
          <Eyebrow>useSplitReveal · on scroll</Eyebrow>
          <h3 ref={headlineRef} className="max-w-[16ch] h1">
            Lines rise out of their own mask.
          </h3>
        </div>

        <div className="flex flex-col dr-gap-8">
          <Eyebrow>useDrawPath · scrubbed</Eyebrow>
          <HorizonDivider ref={arcRef} className="dr-h-80" />
        </div>

        <div className="flex flex-col dr-gap-8">
          <Eyebrow>useScrollLinked</Eyebrow>
          <div
            ref={driftRef}
            className="dr-h-96 dr-w-96 self-center rounded-full bg-gold shadow-[0_0_60px_var(--color-nebula-glow)]"
          />
        </div>

        <div ref={setProgressRef} className="flex flex-col dr-gap-8">
          <Eyebrow>useScrollProgress</Eyebrow>
          <div className="dr-h-4 w-full overflow-clip rounded-full bg-void-3">
            <div
              ref={barRef}
              className="h-full origin-left scale-x-0 bg-gold"
            />
          </div>
        </div>
      </Container>
    </Section>
  )
}
