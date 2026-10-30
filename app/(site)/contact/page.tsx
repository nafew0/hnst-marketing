import { ContactForm } from '@/components/forms/lead-form'
import {
  ContentBlocks,
  PageShell,
  PageHero,
  consentCopy,
} from '@/components/sections/standard/catalog'
import { Heading } from '@/components/ui/heading'
import { Link } from '@/components/ui/link'
import { Section, Container } from '@/components/ui/section'
import { getPage, getSettings } from '@/lib/cms/data'
import { pageMetadata } from '@/lib/seo/cms'
export function generateMetadata() {
  return pageMetadata('contact', 'Contact')
}
export default async function ContactPage() {
  const [page, settings] = await Promise.all([
    getPage('contact'),
    getSettings(),
  ])
  return (
    <PageShell>
      {page ? (
        <ContentBlocks page={page} packages={[]} faqs={[]} />
      ) : (
        <PageHero title="Start a conversation" />
      )}
      <Section>
        <Container className="grid dr-gap-48 dt:grid-cols-2">
          <div>
            <Heading>What are you building?</Heading>
            <p className="dr-mt-24 max-w-[450px] p-big text-silver">
              A few details are all we need to start. No pressure. No
              complicated pitch.
            </p>
            {settings?.publicEmail && (
              <Link
                href={`mailto:${settings.publicEmail}`}
                className="mt-8 inline-block text-gold"
              >
                {settings.publicEmail}
              </Link>
            )}
          </div>
          <div className="rounded-2xl border border-gold/30 bg-void-2 dr-p-32">
            <ContactForm consent={consentCopy(settings)} />
          </div>
        </Container>
      </Section>
    </PageShell>
  )
}
