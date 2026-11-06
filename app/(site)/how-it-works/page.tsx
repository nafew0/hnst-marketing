import { HowItWorksApp } from '@/components/apps/how-it-works'
import { HowItWorksContent } from '@/components/sections/standard/pages/how-it-works'
import { PhoneView } from '@/components/ui/phone/view'
import { WindowPage } from '@/components/ui/window'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('how-it-works', 'How It Works')
}

export default function HowItWorksPage() {
  return (
    <WindowPage href="/how-it-works" title="How it works">
      <PhoneView phone={<HowItWorksApp />}>
        <HowItWorksContent />
      </PhoneView>
    </WindowPage>
  )
}
