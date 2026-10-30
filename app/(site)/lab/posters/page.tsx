import type { Metadata } from 'next'

import { Wrapper } from '@/components/layout/wrapper'

import { Posters } from './posters'

export const metadata: Metadata = {
  title: 'Homepage posters (lab)',
  robots: { index: false, follow: false },
}

export default function PostersPage() {
  return (
    <Wrapper theme="dark" lenis={false}>
      <Posters />
    </Wrapper>
  )
}
