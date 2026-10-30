import {
  loadPageContent,
  StandardPageContent,
} from '@/components/sections/standard/pages/content'

export async function HonestMarketerContent() {
  const content = await loadPageContent('the-honest-marketer')
  return <StandardPageContent {...content} />
}
