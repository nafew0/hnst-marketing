import { PageShell } from '@/components/sections/standard/catalog'
import { ContactContent } from '@/components/sections/standard/pages/contact'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('contact', 'Contact')
}

export default function ContactPage() {
  return (
    <PageShell>
      <ContactContent />
    </PageShell>
  )
}
