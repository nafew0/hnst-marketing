import { PackagesApp } from '@/components/apps/packages'
import { retiredForOffers } from '@/components/home-screen/retired'
import { PackagesContent } from '@/components/sections/standard/pages/packages'
import { PhoneView } from '@/components/ui/phone/view'
import { WindowRoute } from '@/components/ui/window/route'

export { generateMetadata } from '@/app/(site)/packages/page'

export default async function PackagesWindow() {
  await retiredForOffers()
  return (
    <WindowRoute href="/packages" title="Packages">
      <PhoneView phone={<PackagesApp />}>
        <PackagesContent />
      </PhoneView>
    </WindowRoute>
  )
}
