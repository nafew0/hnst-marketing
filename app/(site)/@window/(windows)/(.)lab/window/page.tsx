import { WindowFixture } from '@/app/(site)/lab/window/fixture'
import { WindowRoute } from '@/components/ui/window/route'

export { metadata } from '@/app/(site)/lab/window/page'

export default function WindowFixtureWindow() {
  return (
    <WindowRoute href="/lab/window" title="Window fixture">
      <WindowFixture />
    </WindowRoute>
  )
}
