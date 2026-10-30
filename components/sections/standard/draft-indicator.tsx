import { Badge } from '@/components/ui/badge'
import { Container, Section } from '@/components/ui/section'
export function DraftIndicator({ visible }: { visible: boolean }) {
  return visible ? (
    <Section spacing="none" className="dr-pt-96">
      <Container>
        <Badge>[DRAFT]</Badge>
      </Container>
    </Section>
  ) : null
}
