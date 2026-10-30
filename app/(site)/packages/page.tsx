import { PageShell } from '@/components/sections/standard/catalog'
import { PackagesContent } from '@/components/sections/standard/pages/packages'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('packages', 'Packages')
}

export default function PackagesPage() {
  return (
    <PageShell>
      <PackagesContent />
    </PageShell>
  )
}
