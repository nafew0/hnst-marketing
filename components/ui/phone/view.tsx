import type { ReactNode } from 'react'

import { PHONE_LAYOUT } from './flag'

import s from './view.module.css'

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
 * and crawlers still read the normal content. The classic website (M5) shows
 * the normal content on phones too. Without the flag, only it renders.
 *
 * Settled in M2: the duplicated HTML is acceptable where the phone view is a
 * different presentation of the same CMS data (Packages, How it works, About,
 * The HONEST Marketer, Photos). Never two copies of a form: a phone view puts
 * its forms in a Sheet, which mounts only when opened (M5), and a page that is
 * a form (Calendar, Mail) renders one form that both layouts style (M6).
 */
export function PhoneView({ phone, children }: PhoneViewProps) {
  if (!PHONE_LAYOUT) return children
  return (
    <>
      <div className={s.page}>{children}</div>
      <div className={s.app}>{phone}</div>
    </>
  )
}
