import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageShell, PageHero } from '@/components/sections/standard/catalog'
import { Button } from '@/components/ui/button'
import { Section, Container } from '@/components/ui/section'
export const metadata: Metadata = {
  title: 'Thank you',
  robots: { index: false, follow: false },
}
const messages = {
  contact: 'Your message is in good hands. We’ll be in touch.',
  package:
    'Your interest has been received. We’ll talk through the fit together.',
  magnet: 'Watch your inbox. Your guide will be delivered by email.',
  booking:
    'Check your booking status and confirmation email for the next step.',
}
export default async function ThanksPage({
  params,
}: {
  params: Promise<{ type: string }>
}) {
  const { type } = await params
  if (!Object.hasOwn(messages, type)) notFound()
  const message = Object.entries(messages).find(([key]) => key === type)?.[1]
  return (
    <PageShell>
      <PageHero
        title="Thank you. We’re on it."
        description={message}
        eyebrow="YOUR NEXT CHAPTER"
      />
      <Section>
        <Container>
          <Button href="/packages" variant="ghost">
            Explore the packages
          </Button>
        </Container>
      </Section>
    </PageShell>
  )
}
