import { AboutContent } from '@/components/sections/standard/pages/about'
import { WindowRoute } from '@/components/ui/window/route'

export { generateMetadata } from '@/app/(site)/about/page'

export default function AboutWindow() {
  return (
    <WindowRoute href="/about" title="About">
      <AboutContent />
    </WindowRoute>
  )
}
