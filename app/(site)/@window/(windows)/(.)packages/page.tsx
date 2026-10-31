import { PackagesContent } from '@/components/sections/standard/pages/packages'
import { WindowRoute } from '@/components/ui/window/route'

export { generateMetadata } from '@/app/(site)/packages/page'

export default function PackagesWindow() {
  return (
    <WindowRoute href="/packages" title="Packages">
      <PackagesContent />
    </WindowRoute>
  )
}
