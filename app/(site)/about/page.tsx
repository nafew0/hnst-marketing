import { PageShell } from '@/components/sections/standard/catalog'
import { AboutContent } from '@/components/sections/standard/pages/about'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('about', 'About')
}

export default function AboutPage() {
  return (
    <PageShell>
      <AboutContent />
    </PageShell>
  )
}
