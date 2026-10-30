import { ContactForm } from '@/components/forms/lead-form'
import {
  ContentBlocks,
  PageHero,
  consentCopy,
} from '@/components/sections/standard/catalog'
import { DraftIndicator } from '@/components/sections/standard/draft-indicator'
import { Heading } from '@/components/ui/heading'
import { Link } from '@/components/ui/link'
import { Section, Container } from '@/components/ui/section'
import { getPage, getSettings, readContext } from '@/lib/cms/data'

export async function ContactContent() {
  const [page, settings, context] = await Promise.all([
    getPage('contact'),
    getSettings(),
    readContext(),
  ])
  return (
    <>
      <DraftIndicator
        visible={
          context?.preview === true &&
          (page?._status === 'draft' || settings?._status === 'draft')
        }
      />
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
                className="dr-mt-32 inline-block text-gold"
              >
                {settings.publicEmail}
              </Link>
            )}
          </div>
          <div className="rounded-[16px] border border-gold/30 bg-void-2 dr-p-32">
            <ContactForm consent={consentCopy(settings)} />
          </div>
        </Container>
      </Section>
    </>
  )
}
