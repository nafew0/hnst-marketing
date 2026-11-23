import { SalesPage, salesTitle } from '@/components/sections/sales/page'
import { WindowPage } from '@/components/ui/window'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('mobile-application', 'Mobile Application')
}

export default async function MobileApplicationPage() {
  return (
    <WindowPage
      href="/mobile-application"
      title={await salesTitle('mobile-application', 'Mobile Application')}
    >
      <SalesPage slug="mobile-application" />
    </WindowPage>
  )
}
