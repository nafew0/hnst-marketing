import { PackagesApp } from '@/components/apps/packages'
import { PackagesContent } from '@/components/sections/standard/pages/packages'
import { PhoneView } from '@/components/ui/phone/view'
import { WindowPage } from '@/components/ui/window'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('packages', 'Packages')
}

export default function PackagesPage() {
  return (
    <WindowPage href="/packages" title="Packages">
      <PhoneView phone={<PackagesApp />}>
        <PackagesContent />
      </PhoneView>
    </WindowPage>
  )
}
