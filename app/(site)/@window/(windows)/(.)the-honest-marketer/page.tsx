import { MarketerApp } from '@/components/apps/marketer'
import { HonestMarketerContent } from '@/components/sections/standard/pages/the-honest-marketer'
import { PhoneView } from '@/components/ui/phone/view'
import { WindowRoute } from '@/components/ui/window/route'

export { generateMetadata } from '@/app/(site)/the-honest-marketer/page'

export default function HonestMarketerWindow() {
  return (
    <WindowRoute href="/the-honest-marketer" title="The HONEST Marketer">
      <PhoneView phone={<MarketerApp />}>
        <HonestMarketerContent />
      </PhoneView>
    </WindowRoute>
  )
}
