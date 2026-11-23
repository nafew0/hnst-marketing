import { SalesPage, salesTitle } from '@/components/sections/sales/page'
import { WindowRoute } from '@/components/ui/window/route'

export { generateMetadata } from '@/app/(site)/offers/page'

export default async function OffersWindow() {
  return (
    <WindowRoute href="/offers" title={await salesTitle('offers', 'Offers')}>
      <SalesPage slug="offers" />
    </WindowRoute>
  )
}
