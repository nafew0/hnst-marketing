import { HonestMarketerContent } from '@/components/sections/standard/pages/the-honest-marketer'
import { WindowRoute } from '@/components/ui/window/route'

export { generateMetadata } from '@/app/(site)/the-honest-marketer/page'

export default function HonestMarketerWindow() {
  return (
    <WindowRoute href="/the-honest-marketer" title="The HONEST Marketer">
      <HonestMarketerContent />
    </WindowRoute>
  )
}
