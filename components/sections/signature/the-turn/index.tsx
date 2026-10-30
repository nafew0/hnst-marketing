import { ProgressText } from '@/components/effects/progress-text'
import { turnCopy } from '@/components/sections/signature/copy'
import { Container, Section } from '@/components/ui/section'

import { TurnStage } from './turn-stage'

/**
 * S3. The dunes at scroll-linked camera, the palette turning from the nebula to
 * frontier light, then the statement on the frontier theme below.
 */
export function TheTurn() {
  return (
    <>
      <TurnStage heading={turnCopy.heading} />
      <Section theme="frontier" spacing="lg" aria-label="Why HONEST">
        <Container className="flex flex-col dr-gap-32">
          <p className="max-w-[28ch] h2 text-balance">
            <ProgressText>{turnCopy.body}</ProgressText>
          </p>
          <p className="h2 text-contrast">{turnCopy.closing}</p>
        </Container>
      </Section>
    </>
  )
}
