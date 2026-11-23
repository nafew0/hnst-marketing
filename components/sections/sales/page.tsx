import {
  loadPageContent,
  StandardPageContent,
} from '@/components/sections/standard/pages/content'
import { getPage } from '@/lib/cms/data'

/** The window's title: the page's own, from the CMS. */
export async function salesTitle(slug: string, fallback: string) {
  const page = await getPage(slug)
  return page?.title ?? fallback
}

/** A sales page (Mobile Application, Podcast…): its CMS sections, in order. */
export async function SalesPage({ slug }: { slug: string }) {
  const content = await loadPageContent(slug)
  return <StandardPageContent {...content} />
}
