import { SalesPage, salesTitle } from '@/components/sections/sales/page'
import { WindowPage } from '@/components/ui/window'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('content-gallery', 'Launch Content Gallery')
}

export default async function ContentGalleryPage() {
  return (
    <WindowPage
      href="/content-gallery"
      title={await salesTitle('content-gallery', 'Launch Content Gallery')}
    >
      <SalesPage slug="content-gallery" />
    </WindowPage>
  )
}
