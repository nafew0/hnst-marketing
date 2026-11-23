import { SalesPage, salesTitle } from '@/components/sections/sales/page'
import { WindowPage } from '@/components/ui/window'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('offers', 'Offers')
}

export default async function OffersPage() {
  return (
    <WindowPage href="/offers" title={await salesTitle('offers', 'Offers')}>
      <SalesPage slug="offers" />
    </WindowPage>
  )
}
