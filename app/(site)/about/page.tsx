import { AboutApp } from '@/components/apps/about'
import { AboutContent } from '@/components/sections/standard/pages/about'
import { PhoneView } from '@/components/ui/phone/view'
import { WindowPage } from '@/components/ui/window'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('about', 'About')
}

export default function AboutPage() {
  return (
    <WindowPage href="/about" title="About">
      <PhoneView phone={<AboutApp />}>
        <AboutContent />
      </PhoneView>
    </WindowPage>
  )
}
