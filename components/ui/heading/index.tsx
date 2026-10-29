import cn from 'clsx'
import type { ComponentProps } from 'react'

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'p'
type HeadingSize = 'display' | 'h1' | 'h2' | 'h3' | 'h4'

interface HeadingProps extends ComponentProps<'h2'> {
  /** The element, for document outline. Defaults to `h2`. */
  as?: HeadingTag
  /** The look, independent of the element. Defaults to the tag's own size. */
  size?: HeadingSize
}

/** Bodoni Moda headline. One `h1` per page; pick `size` for the look. */
export function Heading({
  as: Tag = 'h2',
  size,
  className,
  ...props
}: HeadingProps) {
  const look = size ?? (Tag === 'p' ? 'h2' : Tag)
  return (
    <Tag
      className={cn(
        'text-balance',
        look === 'display' && 'display',
        look === 'h1' && 'h1',
        look === 'h2' && 'h2',
        look === 'h3' && 'h3',
        look === 'h4' && 'h4',
        className
      )}
      {...props}
    />
  )
}

/**
 * Small uppercase kicker above a headline, in the theme's `contrast` colour:
 * gold on dark, bronze on light (gold on cream fails contrast).
 */
export function Eyebrow({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn('eyebrow text-contrast uppercase', className)}
      {...props}
    />
  )
}
