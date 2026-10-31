import { PackagesContent } from '@/components/sections/standard/pages/packages'
import { WindowPage } from '@/components/ui/window'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('packages', 'Packages')
}

export default function PackagesPage() {
  return (
    <WindowPage href="/packages" title="Packages">
      <PackagesContent />
    </WindowPage>
  )
}
