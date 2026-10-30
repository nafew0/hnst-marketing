import { PageShell } from '@/components/sections/standard/catalog'
import { BookContent } from '@/components/sections/standard/pages/book'
import { pageMetadata } from '@/lib/seo/cms'

export function generateMetadata() {
  return pageMetadata('book', 'Book')
}

export default function BookPage() {
  return (
    <PageShell>
      <BookContent />
    </PageShell>
  )
}
