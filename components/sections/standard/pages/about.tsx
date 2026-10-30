import {
  loadPageContent,
  StandardPageContent,
} from '@/components/sections/standard/pages/content'

export async function AboutContent() {
  const content = await loadPageContent('about')
  return <StandardPageContent {...content} />
}
