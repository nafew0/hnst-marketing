import { PhotosApp } from '@/components/apps/photos'
import { ProofContent } from '@/components/sections/standard/pages/proof'
import { PhoneView } from '@/components/ui/phone/view'
import { WindowRoute } from '@/components/ui/window/route'

export { generateMetadata } from '@/app/(site)/proof/page'

export default function ProofWindow() {
  return (
    <WindowRoute href="/proof" title="Proof">
      <PhoneView phone={<PhotosApp />}>
        <ProofContent />
      </PhoneView>
    </WindowRoute>
  )
}
