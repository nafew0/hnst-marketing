import { ProgressText } from '@/components/effects/progress-text'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/heading'
import { Container, Section } from '@/components/ui/section'

// DRAFT copy for v0 (P1), pending the Founder's homepage copy (docs/PLAN.md
// § 6). P7 replaces the homepage sections; e2e/progress-text.e2e.ts reads
// the last sentence.
const MANIFESTO =
  'Most agencies sell you hours. We sell you the finished package: research, brand, campaign, website, email and a month of content, built by AI agents and checked by people. You own everything we make.'

/** Scroll-revealed statement under the hero (Satus `ProgressText`). */
export function Manifesto() {
  return (
    <Section spacing="lg" aria-labelledby="manifesto-title">
      <Container className="flex flex-col items-start dr-gap-32">
        <Eyebrow id="manifesto-title">Why HONEST</Eyebrow>
        <p className="max-w-[24ch] h2 text-balance">
          <ProgressText>{MANIFESTO}</ProgressText>
        </p>
        <Button href="/packages" variant="ghost">
          See packages
        </Button>
      </Container>
    </Section>
  )
}
