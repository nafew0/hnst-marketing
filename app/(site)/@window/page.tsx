import { Suspense } from 'react'

import { PHONE_LAYOUT } from '@/components/ui/phone/flag'
import { PhoneOnlyRoute } from '@/components/ui/phone/only-route'

/**
 * `/`: without this a soft navigation home would keep the slot's last window.
 * In the phone layout it also opens phone-only apps (`/?app=camera`).
 */
export default function WindowHome() {
  if (!PHONE_LAYOUT) return null
  return (
    <Suspense fallback={null}>
      <PhoneOnlyRoute />
    </Suspense>
  )
}
