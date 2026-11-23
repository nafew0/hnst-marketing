import { SalesPage, salesTitle } from '@/components/sections/sales/page'
import { WindowRoute } from '@/components/ui/window/route'

export { generateMetadata } from '@/app/(site)/content-gallery/page'

export default async function ContentGalleryWindow() {
  return (
    <WindowRoute
      href="/content-gallery"
      title={await salesTitle('content-gallery', 'Launch Content Gallery')}
    >
      <SalesPage slug="content-gallery" />
    </WindowRoute>
  )
}
