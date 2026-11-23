import { SalesPage, salesTitle } from '@/components/sections/sales/page'
import { WindowRoute } from '@/components/ui/window/route'

export { generateMetadata } from '@/app/(site)/mobile-application/page'

export default async function MobileApplicationWindow() {
  return (
    <WindowRoute
      href="/mobile-application"
      title={await salesTitle('mobile-application', 'Mobile Application')}
    >
      <SalesPage slug="mobile-application" />
    </WindowRoute>
  )
}
