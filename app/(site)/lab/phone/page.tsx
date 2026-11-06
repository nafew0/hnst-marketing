import type { Metadata } from 'next'

import { Wrapper } from '@/components/layout/wrapper'

import { PhoneLab } from './lab'

export const metadata: Metadata = {
  title: 'Phone layout',
  robots: { index: false, follow: false },
}

/**
 * Noindex showcase for the phone layout (components/ui/phone/README.md):
 * every app icon, the kit, and a button per notification trigger.
 */
export default function PhoneLabPage() {
  return (
    <Wrapper lenis={false}>
      <PhoneLab />
    </Wrapper>
  )
}
