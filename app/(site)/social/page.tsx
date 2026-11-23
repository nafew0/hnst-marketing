import { SalesPage, salesTitle } from '@/components/sections/sales/page'
import { WindowPage } from '@/components/ui/window'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('social', 'Social media')
}

export default async function SocialPage() {
  return (
    <WindowPage
      href="/social"
      title={await salesTitle('social', 'Social media')}
    >
      <SalesPage slug="social" />
    </WindowPage>
  )
}
