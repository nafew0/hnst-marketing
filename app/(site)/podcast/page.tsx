import { SalesPage, salesTitle } from '@/components/sections/sales/page'
import { WindowPage } from '@/components/ui/window'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('podcast', 'Podcast')
}

export default async function PodcastPage() {
  return (
    <WindowPage href="/podcast" title={await salesTitle('podcast', 'Podcast')}>
      <SalesPage slug="podcast" />
    </WindowPage>
  )
}
