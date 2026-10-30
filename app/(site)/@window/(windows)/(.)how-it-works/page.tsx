import { HowItWorksContent } from '@/components/sections/standard/pages/how-it-works'
import { WindowRoute } from '@/components/ui/window/route'

export { generateMetadata } from '@/app/(site)/how-it-works/page'

export default function HowItWorksWindow() {
  return (
    <WindowRoute href="/how-it-works" title="How it works">
      <HowItWorksContent />
    </WindowRoute>
  )
}
