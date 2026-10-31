import { HonestMarketerContent } from '@/components/sections/standard/pages/the-honest-marketer'
import { WindowPage } from '@/components/ui/window'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('the-honest-marketer', 'The Honest Marketer')
}

export default function HonestMarketerPage() {
  return (
    <WindowPage href="/the-honest-marketer" title="The HONEST Marketer">
      <HonestMarketerContent />
    </WindowPage>
  )
}
