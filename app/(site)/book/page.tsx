import { BookContent } from '@/components/sections/standard/pages/book'
import { WindowPage } from '@/components/ui/window'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('book', 'Book')
}

export default function BookPage() {
  return (
    <WindowPage href="/book" title="Book a call">
      <BookContent />
    </WindowPage>
  )
}
