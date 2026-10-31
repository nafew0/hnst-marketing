import { ProofContent } from '@/components/sections/standard/pages/proof'
import { WindowRoute } from '@/components/ui/window/route'

export { generateMetadata } from '@/app/(site)/proof/page'

export default function ProofWindow() {
  return (
    <WindowRoute href="/proof" title="Proof">
      <ProofContent />
    </WindowRoute>
  )
}
