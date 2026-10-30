import { HowItWorksContent } from '@/components/sections/standard/pages/how-it-works'
import { WindowPage } from '@/components/ui/window'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('how-it-works', 'How It Works')
}

export default function HowItWorksPage() {
  return (
    <WindowPage href="/how-it-works" title="How it works">
      <HowItWorksContent />
    </WindowPage>
  )
}
