import { SalesPage, salesTitle } from '@/components/sections/sales/page'
import { WindowRoute } from '@/components/ui/window/route'

export { generateMetadata } from '@/app/(site)/social/page'

export default async function SocialWindow() {
  return (
    <WindowRoute
      href="/social"
      title={await salesTitle('social', 'Social media')}
    >
      <SalesPage slug="social" />
    </WindowRoute>
  )
}
