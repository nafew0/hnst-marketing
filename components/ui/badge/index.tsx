import cn from 'clsx'
import type { ComponentProps } from 'react'

interface BadgeProps extends ComponentProps<'span'> {
  tone?: 'gold' | 'nebula' | 'outline'
}

/** Small uppercase label: "Most popular", "7–14 days", "Draft". */
export function Badge({ tone = 'gold', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full dr-px-12 dr-py-6 eyebrow whitespace-nowrap uppercase',
        tone === 'gold' && 'bg-gold text-void',
        tone === 'nebula' &&
          'bg-nebula-deep text-nebula-tint ring-1 ring-nebula-haze ring-inset',
        tone === 'outline' &&
          'text-contrast ring-1 ring-contrast/50 ring-inset',
        className
      )}
      {...props}
    />
  )
}
