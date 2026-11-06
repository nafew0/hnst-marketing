import cn from 'clsx'
import type { ReactNode } from 'react'

import s from './kit.module.css'

interface PhoneScreenProps {
  /** The app's large title: the page's `<h1>`, as P7W keeps it in the content. */
  title: string
  /** Under the title, e.g. a segmented control or a short line of copy. */
  accessory?: ReactNode
  className?: string | undefined
  children: ReactNode
}

/**
 * An app's own screen inside the phone frame: an iOS-style large title, then
 * the content with the phone's margins. The frame (back, title, home bar)
 * comes from the window layer; this is what sits inside it.
 */
export function PhoneScreen({
  title,
  accessory,
  className,
  children,
}: PhoneScreenProps) {
  return (
    <div className={cn(s.screen, className)}>
      <div className={s.header}>
        <h1 className={s.largeTitle}>{title}</h1>
        {accessory}
      </div>
      {children}
    </div>
  )
}
