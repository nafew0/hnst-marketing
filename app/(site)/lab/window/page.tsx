import type { Metadata } from 'next'

import { Wrapper } from '@/components/layout/wrapper'

import { WindowFixture } from './fixture'

export const metadata: Metadata = {
  title: 'Window fixture',
  robots: { index: false, follow: false },
}

/** Noindex test fixture for the window layer's stacking and form behaviour. */
export default function WindowFixturePage() {
  return (
    <Wrapper lenis={false}>
      <WindowFixture />
    </Wrapper>
  )
}
