import {
  loadPageContent,
  StandardPageContent,
} from '@/components/sections/standard/pages/content'

export async function BookContent() {
  const content = await loadPageContent('book')
  return <StandardPageContent {...content} />
}
