import { PageShell } from '@/components/sections/standard/catalog'
import { ProofContent } from '@/components/sections/standard/pages/proof'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('proof', 'Proof')
}

export default function ProofPage() {
  return (
    <PageShell>
      <ProofContent />
    </PageShell>
  )
}
