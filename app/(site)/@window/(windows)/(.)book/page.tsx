import { BookContent } from '@/components/sections/standard/pages/book'
import { WindowRoute } from '@/components/ui/window/route'

export { generateMetadata } from '@/app/(site)/book/page'

export default function BookWindow() {
  return (
    <WindowRoute href="/book" title="Book a call">
      <BookContent />
    </WindowRoute>
  )
}
