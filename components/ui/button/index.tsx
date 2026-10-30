import cn from 'clsx'
import type { ComponentProps, ReactNode } from 'react'

import { Link } from '@/components/ui/link'

import s from './button.module.css'

type ButtonVariant = 'gold' | 'ghost' | 'link'

interface ButtonBaseProps {
  /** `gold` = primary CTA (one per view), `ghost` = secondary, `link` = inline. */
  variant?: ButtonVariant
  size?: 'md' | 'lg'
  className?: string
  children: ReactNode
}

type ButtonAsButton = ButtonBaseProps &
  Omit<ComponentProps<'button'>, keyof ButtonBaseProps | 'type'> & {
    href?: undefined
    /** Forms reset by remounting (Satus <Form>), so there is no `reset`. */
    type?: 'button' | 'submit'
  }

type ButtonAsLink = ButtonBaseProps &
  Omit<ComponentProps<typeof Link>, keyof ButtonBaseProps> & { href: string }

export type ButtonProps = ButtonAsButton | ButtonAsLink

/**
 * Renders `<Link>` when given `href`, otherwise `<button>` (default
 * `type="button"`). Hover transitions stay under 200 ms; the press scale only
 * runs when motion is allowed.
 */
export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const {
      variant = 'gold',
      size = 'md',
      className,
      children,
      ...rest
    } = props
    return (
      <Link
        className={cn(
          s.button,
          s[variant],
          size === 'lg' && s.lg,
          'cta',
          className
        )}
        {...rest}
      >
        {children}
      </Link>
    )
  }

  const {
    variant = 'gold',
    size = 'md',
    className,
    children,
    type,
    ...rest
  } = props
  return (
    <button
      type={type === 'submit' ? 'submit' : 'button'}
      className={cn(
        s.button,
        s[variant],
        size === 'lg' && s.lg,
        'cta',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
