import type { ReactNode } from 'react'

import { PHONE_LAYOUT } from './flag'

interface PhoneViewProps {
  /** The app's view for phones, e.g. Packages as a store. */
  phone: ReactNode
  /** The page's normal content, for computers. */
  children: ReactNode
}

/**
 * How a content app's page shows its phone view (docs/phases/M5.md). Used in
 * both the intercepted route and the direct page, so a window and a direct
 * visit agree. Both are server-rendered and CSS picks one, so nothing flashes
 * and crawlers still read the normal content. Without the flag, only the
 * normal content renders.
 *
 * Settled in M2: the duplicated HTML is acceptable where the phone view is a
 * different presentation of the same CMS data (Packages, How it works, About,
 * The HONEST Marketer, Photos). It is not for pages with forms (Calendar,
 * Mail, the magnet form): two copies of a form mean duplicate ids and labels,
 * so those render one form that both layouts style.
 */
export function PhoneView({ phone, children }: PhoneViewProps) {
  if (!PHONE_LAYOUT) return children
  return (
    <>
      <div className="contents desktop-only">{children}</div>
      <div className="contents mobile-only">{phone}</div>
    </>
  )
}
