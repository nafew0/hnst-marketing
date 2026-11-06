import { HowItWorksApp } from '@/components/apps/how-it-works'
import { HowItWorksContent } from '@/components/sections/standard/pages/how-it-works'
import { PhoneView } from '@/components/ui/phone/view'
import { WindowRoute } from '@/components/ui/window/route'

export { generateMetadata } from '@/app/(site)/how-it-works/page'

export default function HowItWorksWindow() {
  return (
    <WindowRoute href="/how-it-works" title="How it works">
      <PhoneView phone={<HowItWorksApp />}>
        <HowItWorksContent />
      </PhoneView>
    </WindowRoute>
  )
}
