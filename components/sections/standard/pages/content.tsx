import {
  CmsUnavailable,
  ContentBlocks,
  PageHero,
} from '@/components/sections/standard/catalog'
import { DraftIndicator } from '@/components/sections/standard/draft-indicator'
import { getFaqs, getPage, getSettings, readContext } from '@/lib/cms/data'

export async function loadPageContent(slug: string) {
  const [page, settings, context, faqs] = await Promise.all([
    getPage(slug),
    getSettings(),
    readContext(),
    slug === 'how-it-works' ? getFaqs() : Promise.resolve([]),
  ])
  return { page, settings, preview: context?.preview === true, faqs }
}
export function StandardPageContent({
  page,
  settings,
  preview,
  faqs,
}: Awaited<ReturnType<typeof loadPageContent>>) {
  if (!page)
    return (
      <>
        <PageHero title="Page in preparation" />
        <CmsUnavailable />
      </>
    )
  return (
    <>
      <DraftIndicator
        visible={
          preview && (page._status === 'draft' || settings?._status === 'draft')
        }
      />
      <ContentBlocks
        page={page}
        settings={settings}
        faqs={faqs}
        packages={[]}
      />
    </>
  )
}
