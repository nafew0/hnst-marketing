import {
  CmsUnavailable,
  ContentBlocks,
  PageHero,
} from '@/components/sections/standard/catalog'
import { DraftIndicator } from '@/components/sections/standard/draft-indicator'
import {
  getFaqs,
  getPage,
  getPublishedHomeScreen,
  getSettings,
  readContext,
} from '@/lib/cms/data'

export async function loadPageContent(slug: string) {
  const [page, settings, context, faqs, { screen }] = await Promise.all([
    getPage(slug),
    getSettings(),
    readContext(),
    slug === 'how-it-works' ? getFaqs() : Promise.resolve([]),
    getPublishedHomeScreen(),
  ])
  return {
    page,
    settings,
    preview: context?.preview === true,
    faqs,
    bar: screen.bar,
  }
}
export function StandardPageContent({
  page,
  settings,
  preview,
  faqs,
  bar,
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
        bar={bar}
      />
    </>
  )
}
