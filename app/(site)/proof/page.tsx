import { ProofContent } from '@/components/sections/standard/pages/proof'
import { WindowPage } from '@/components/ui/window'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('proof', 'Proof')
}

export default function ProofPage() {
  return (
    <WindowPage href="/proof" title="Proof">
      <ProofContent />
    </WindowPage>
  )
}
