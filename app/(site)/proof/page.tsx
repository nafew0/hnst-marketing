import { PhotosApp } from '@/components/apps/photos'
import { ProofContent } from '@/components/sections/standard/pages/proof'
import { PhoneView } from '@/components/ui/phone/view'
import { WindowPage } from '@/components/ui/window'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('proof', 'Proof')
}

export default function ProofPage() {
  return (
    <WindowPage href="/proof" title="Proof">
      <PhoneView phone={<PhotosApp />}>
        <ProofContent />
      </PhoneView>
    </WindowPage>
  )
}
