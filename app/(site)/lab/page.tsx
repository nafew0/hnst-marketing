import type { Metadata } from 'next'

import { brand } from '@/brand.config'
import { Wrapper } from '@/components/layout/wrapper'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Eyebrow, Heading } from '@/components/ui/heading'
import { HorizonDivider } from '@/components/ui/horizon-divider'
import { Logo } from '@/components/ui/logo'
import { Container, Section } from '@/components/ui/section'
import { routeAlternates } from '@/lib/seo/alternates'

import { LabForm } from './lab-form'
import { LabMotion } from './lab-motion'

export const metadata: Metadata = {
  title: 'Lab',
  description: 'Internal component showcase for the HONEST Marketing site.',
  alternates: routeAlternates('/lab'),
  robots: { index: false, follow: false },
}

const TYPE_SAMPLES = [
  ['display', 'Done honestly.'],
  ['h1', 'Your whole marketing package'],
  ['h2', 'Seven deliverables, one week'],
  ['h3', 'The Founder Package'],
  ['h4', 'Brand bible and positioning'],
  ['p-big', 'Brand, research, campaign, website, email and content.'],
  ['p', 'Body copy in Inter: produced with AI, reviewed by people.'],
  ['caption', 'Caption: prices exclude tax.'],
  ['eyebrow', 'Eyebrow · Archivo Narrow'],
  ['cta', 'CTA label'],
  ['link', 'Link label'],
] as const

/**
 * Internal showcase (noindex). Everything here reads brand.config.ts: edit a
 * colour there, run `bun run tokens`, and this page re-colours.
 */
export default function LabPage() {
  return (
    <Wrapper theme="dark" lenis={{}}>
      <Section spacing="lg" className="dr-pt-160">
        <Container className="flex flex-col dr-gap-24">
          <Eyebrow>Lab · noindex</Eyebrow>
          <Heading as="h1">Component lab</Heading>
          <p className="max-w-[52ch] p-big text-pretty text-silver">
            Tokens, primitives and motion from Phase 1. Every colour, font and
            duration on this page comes from brand.config.ts.
          </p>
        </Container>
      </Section>

      <Section aria-labelledby="lab-colours">
        <Container className="flex flex-col dr-gap-32">
          <Heading id="lab-colours">Colours</Heading>
          <ul className="grid grid-cols-2 dr-gap-16 dt:grid-cols-6">
            {Object.entries(brand.palette).map(([name, value]) => (
              <li key={name} className="flex flex-col dr-gap-8">
                <span
                  className="block aspect-square w-full dr-rounded-12 ring-1 ring-starlight/15 ring-inset"
                  style={{ backgroundColor: `var(--color-${name})` }}
                />
                <span className="eyebrow uppercase">{name}</span>
                <span className="caption break-all text-silver">{value}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section aria-labelledby="lab-type">
        <Container className="flex flex-col dr-gap-32">
          <Heading id="lab-type">Type</Heading>
          <ul className="flex flex-col dr-gap-24">
            {TYPE_SAMPLES.map(([style, sample]) => (
              <li
                key={style}
                className="flex flex-col dr-gap-8 border-b border-gold/15 dr-pb-16"
              >
                <span className="caption text-silver">{style}</span>
                <span className={style}>{sample}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section aria-labelledby="lab-ui">
        <Container className="flex flex-col dr-gap-40">
          <Heading id="lab-ui">Primitives</Heading>
          <div className="flex flex-wrap items-center dr-gap-16">
            <Button>Book a call</Button>
            <Button variant="ghost">See packages</Button>
            <Button variant="link">Read the terms</Button>
            <Button size="lg">Large gold</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap dr-gap-12">
            <Badge>Most popular</Badge>
            <Badge tone="nebula">7–14 days</Badge>
            <Badge tone="outline">Draft</Badge>
          </div>
          <div className="grid dr-gap-16 dt:grid-cols-3">
            <Card>
              <Eyebrow>Executive</Eyebrow>
              <Heading as="h3">$2,500</Heading>
              <p className="p text-silver">A plain card.</p>
            </Card>
            <Card featured interactive>
              <Badge className="self-start">Most popular</Badge>
              <Heading as="h3">Founder Package</Heading>
              <p className="p text-silver">Featured and interactive.</p>
              <Button href="/packages" variant="link">
                Details
              </Button>
            </Card>
            <Card interactive>
              <Eyebrow>Diamond</Eyebrow>
              <Heading as="h3">$25,000+</Heading>
              <p className="p text-silver">Interactive card.</p>
            </Card>
          </div>
          <div className="flex flex-col items-center dr-gap-40 dr-rounded-24 bg-void-deep dr-p-40">
            <Logo tagline className="max-w-[420px]" />
            <HorizonDivider className="dr-h-64" />
          </div>
        </Container>
      </Section>

      <Section theme="frontier" aria-labelledby="lab-themes">
        <Container className="flex flex-col dr-gap-16">
          <Eyebrow>Theme · frontier</Eyebrow>
          <Heading id="lab-themes">The turn: nebula to frontier gold</Heading>
          <p className="max-w-[52ch] p text-pretty">
            Sections re-theme with <code>theme</code>: primary, secondary and
            contrast remap per [data-theme].
          </p>
        </Container>
      </Section>

      <Section theme="light" aria-labelledby="lab-light">
        <Container className="flex flex-col dr-gap-16">
          <Eyebrow>Theme · light</Eyebrow>
          <Heading id="lab-light">Light pages (legal, long reads)</Heading>
        </Container>
      </Section>

      <LabMotion />
      <LabForm />
    </Wrapper>
  )
}
