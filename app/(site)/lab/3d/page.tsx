import type { Metadata } from 'next'

import { Wrapper } from '@/components/layout/wrapper'
import { routeAlternates } from '@/lib/seo/alternates'

import { Lab3D } from './lab-3d'

export const metadata: Metadata = {
  title: '3D lab',
  description: 'Internal showcase for the HONEST Marketing 3D world.',
  alternates: routeAlternates('/lab/3d'),
  robots: { index: false, follow: false },
}

/**
 * Internal (noindex): every P4 scene with a tier switcher, brand-value
 * sliders, a triangle and FPS readout, and poster rendering (development).
 */
export default function Lab3DPage() {
  return (
    <Wrapper theme="dark" lenis={{}}>
      <Lab3D />
    </Wrapper>
  )
}
