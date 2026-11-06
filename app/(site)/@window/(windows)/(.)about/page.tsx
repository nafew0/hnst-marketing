import { AboutApp } from '@/components/apps/about'
import { AboutContent } from '@/components/sections/standard/pages/about'
import { PhoneView } from '@/components/ui/phone/view'
import { WindowRoute } from '@/components/ui/window/route'

export { generateMetadata } from '@/app/(site)/about/page'

export default function AboutWindow() {
  return (
    <WindowRoute href="/about" title="About">
      <PhoneView phone={<AboutApp />}>
        <AboutContent />
      </PhoneView>
    </WindowRoute>
  )
}
