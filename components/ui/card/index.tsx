import cn from 'clsx'
import type { ComponentProps } from 'react'

import s from './card.module.css'

interface CardProps extends ComponentProps<'div'> {
  /** Gold edge and nebula glow, for the one highlighted item in a set. */
  featured?: boolean
  /** Hover and focus-within edge, for cards that contain a link or button. */
  interactive?: boolean
}

/** Dark surface with a hairline gold edge: packages, steps, proof items. */
export function Card({
  featured = false,
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      data-card
      className={cn(
        s.card,
        featured && s.featured,
        interactive && s.interactive,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
