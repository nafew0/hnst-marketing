import { PageShell, PageHero } from '@/components/sections/standard/catalog'
import { Button } from '@/components/ui/button'
import { Container, Section } from '@/components/ui/section'
export default function NotFound() {
  return (
    <PageShell>
      <PageHero
        title="A little off the map."
        description="We couldn’t find that page. Let’s get you back on track."
        eyebrow="404 — PAGE NOT FOUND"
      />
      <Section>
        <Container>
          <Button href="/">Back to HONEST</Button>
        </Container>
      </Section>
    </PageShell>
  )
}
