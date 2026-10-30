import type { Metadata } from 'next'

import { Wrapper } from '@/components/layout/wrapper'
import { Eyebrow, Heading } from '@/components/ui/heading'
import { Container } from '@/components/ui/section'
import { routeAlternates } from '@/lib/seo/alternates'

import { Cube } from './cube'

export const metadata: Metadata = {
  title: 'WebGL lab',
  description: 'Internal fixture for the root canvas drawing on demand.',
  alternates: routeAlternates('/lab/webgl'),
  robots: { index: false, follow: false },
}

/**
 * Internal (noindex) fixture for `e2e/render-on-demand.e2e.ts`: spinning
 * cubes drawn in the root canvas, each on a dashed box that CSS lays out.
 * One cube sits in the first screen; a gap at least two screens tall
 * separates it from the row below, so there is always a scroll position with
 * every cube off screen. Plain sections, not `Section`: its positioned theme
 * background paints over the canvas.
 */
export default function LabWebGLPage() {
  return (
    <Wrapper theme="dark">
      <section className="flex min-h-svh flex-col justify-center">
        <Container className="flex flex-col dr-gap-40 dt:flex-row dt:items-center dt:justify-between">
          <div className="flex flex-col dr-gap-16">
            <Eyebrow>Lab · noindex</Eyebrow>
            <Heading as="h1">WebGL on demand</Heading>
            <p className="max-w-[52ch] p text-pretty text-silver">
              Each dashed box is a plain div. Its cube is drawn in the shared
              root canvas, which draws only while something keeps it awake.
            </p>
          </div>
          <Cube className="dr-w-240 shrink-0" />
        </Container>
      </section>

      <section className="min-h-[200svh]">
        <Container className="flex flex-col dr-gap-16">
          <Heading>When the canvas draws</Heading>
          <ul className="flex max-w-[60ch] list-disc flex-col dr-gap-8 dr-pl-20 p text-silver">
            <li>
              A cube on screen holds a lease, so its spin draws every frame.
            </li>
            <li>
              A scroll moves every cube, on screen or not, and wakes the canvas
              for a two-second grace.
            </li>
            <li>
              With every cube off screen and the grace run out, it stops drawing
              and keeps its last picture.
            </li>
          </ul>
        </Container>
      </section>

      <section className="dr-pb-120">
        <Container className="flex flex-wrap items-end dr-gap-48">
          <Cube className="dr-w-96" />
          <Cube className="dr-w-220" />
        </Container>
      </section>
    </Wrapper>
  )
}
