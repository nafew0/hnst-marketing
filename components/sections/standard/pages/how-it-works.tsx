import {
  loadPageContent,
  StandardPageContent,
} from '@/components/sections/standard/pages/content'

export async function HowItWorksContent() {
  const content = await loadPageContent('how-it-works')
  return <StandardPageContent {...content} />
}
