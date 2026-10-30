import { PageShell } from '@/components/sections/standard/catalog'
import { HonestMarketerContent } from '@/components/sections/standard/pages/the-honest-marketer'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('the-honest-marketer', 'The Honest Marketer')
}

export default function HonestMarketerPage() {
  return (
    <PageShell>
      <HonestMarketerContent />
    </PageShell>
  )
}
