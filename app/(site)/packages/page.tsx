import {
  ContentBlocks,
  PageShell,
  PageHero,
  CmsUnavailable,
} from '@/components/sections/standard/catalog'
import { Container, Section } from '@/components/ui/section'
import { getPage, getPackages, getFaqs, getSettings } from '@/lib/cms/data'
import { pageMetadata } from '@/lib/seo/cms'
export function generateMetadata() {
  return pageMetadata('packages', 'Packages')
}
export default async function PackagesPage() {
  const [page, packages, faqs, settings] = await Promise.all([
    getPage('packages'),
    getPackages(),
    getFaqs(),
    getSettings(),
  ])
  return (
    <PageShell>
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
    </PageShell>
  )
}
