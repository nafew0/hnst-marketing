import { PageShell } from '@/components/sections/standard/catalog'
import { HowItWorksContent } from '@/components/sections/standard/pages/how-it-works'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('how-it-works', 'How It Works')
}

export default function HowItWorksPage() {
  return (
    <PageShell>
      <HowItWorksContent />
    </PageShell>
  )
}
