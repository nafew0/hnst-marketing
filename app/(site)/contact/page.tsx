import { ContactContent } from '@/components/sections/standard/pages/contact'
import { WindowPage } from '@/components/ui/window'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('contact', 'Contact')
}

export default function ContactPage() {
  return (
    <WindowPage href="/contact" title="Contact">
      <ContactContent />
    </WindowPage>
  )
}
