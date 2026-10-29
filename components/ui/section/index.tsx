import cn from 'clsx'
import type { ComponentProps } from 'react'

import type { ThemeName } from '@/styles/config'

interface SectionProps extends ComponentProps<'section'> {
  /** Re-themes this section only (`[data-theme]` remaps the semantic tokens). */
  theme?: ThemeName
  spacing?: 'none' | 'md' | 'lg'
}

/** Page band: vertical rhythm, optional theme, background from the theme. */
export function Section({
  theme,
  spacing = 'md',
  className,
  ...props
}: SectionProps) {
  return (
    <section
      data-theme={theme}
      className={cn(
        'relative bg-primary text-secondary',
        spacing === 'md' && 'dr-py-72 dt:dr-py-120',
        spacing === 'lg' && 'dr-py-96 dt:dr-py-180',
        className
      )}
      {...props}
    />
  )
}

/** Centred content column with the layout's safe margins. */
export function Container({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('dr-layout-block', className)} {...props} />
}
