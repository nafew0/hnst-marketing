import { SalesPage, salesTitle } from '@/components/sections/sales/page'
import { WindowRoute } from '@/components/ui/window/route'

export { generateMetadata } from '@/app/(site)/podcast/page'

export default async function PodcastWindow() {
  return (
    <WindowRoute href="/podcast" title={await salesTitle('podcast', 'Podcast')}>
      <SalesPage slug="podcast" />
    </WindowRoute>
  )
}
