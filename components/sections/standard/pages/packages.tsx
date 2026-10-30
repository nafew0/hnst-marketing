import {
  ContentBlocks,
  PageHero,
  CmsUnavailable,
} from '@/components/sections/standard/catalog'
import { DraftIndicator } from '@/components/sections/standard/draft-indicator'
import { Container, Section } from '@/components/ui/section'
import {
  getPage,
  getPackages,
  getFaqs,
  getSettings,
  readContext,
} from '@/lib/cms/data'

export async function PackagesContent() {
  const [page, packages, faqs, settings, context] = await Promise.all([
    getPage('packages'),
    getPackages(),
    getFaqs(),
    getSettings(),
    readContext(),
  ])
  return (
    <>
      <DraftIndicator
        visible={
          context?.preview === true &&
          (page?._status === 'draft' ||
            settings?._status === 'draft' ||
            packages.some((item) => item._status === 'draft'))
        }
      />
      {page ? (
        <ContentBlocks page={page} packages={packages} faqs={faqs} />
      ) : (
        <>
          <PageHero title="Our packages" />
          <CmsUnavailable />
        </>
      )}
      <Section>
        <Container>
          <p className="max-w-[800px] p text-silver">
            {settings?.toolCostDisclosure}
          </p>
        </Container>
      </Section>
    </>
  )
}
