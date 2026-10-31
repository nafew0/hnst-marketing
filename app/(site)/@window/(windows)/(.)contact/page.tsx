import { ContactContent } from '@/components/sections/standard/pages/contact'
import { WindowRoute } from '@/components/ui/window/route'

export { generateMetadata } from '@/app/(site)/contact/page'

export default function ContactWindow() {
  return (
    <WindowRoute href="/contact" title="Contact">
      <ContactContent />
    </WindowRoute>
  )
}
