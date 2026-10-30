import {
  loadPageContent,
  StandardPageContent,
} from '@/components/sections/standard/pages/content'

export async function ProofContent() {
  const content = await loadPageContent('proof')
  return <StandardPageContent {...content} />
}
