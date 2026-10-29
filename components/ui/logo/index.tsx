import cn from 'clsx'
import { type ComponentProps, useId } from 'react'

import { HONEST_LETTERS, MARKETING_LETTERS, STARBURST } from './paths'

interface LogoProps extends Omit<ComponentProps<'svg'>, 'children'> {
  /** Show "Powered by HONEST SuperIntelligence" under the mark. */
  tagline?: boolean
  /** Set `false` when the logo sits next to visible "HONEST Marketing" text. */
  title?: string | false
}

/**
 * HONEST Marketing primary mark: gold-metal wordmark with the starburst.
 * Colours come from brand.config.ts (gold-metal-1…4), not the artwork's hex
 * stops. The metal gradient runs bottom to top across each letter's own box,
 * as in the artwork. Animate the starburst through `[data-starburst]` and the
 * wordmark through `[data-wordmark]`.
 */
export function Logo({
  tagline = false,
  title = 'HONEST Marketing',
  className,
  ...props
}: LogoProps) {
  const id = useId()
  const metal = `${id}-metal`
  const flare = `${id}-flare`
  const height = tagline ? 120 : 96

  return (
    <svg
      viewBox={`0 0 299.39 ${height}`}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      className={cn('block h-auto w-full overflow-visible', className)}
      {...props}
    >
      <defs>
        <linearGradient id={metal} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0.03" stopColor="var(--color-gold-metal-1)" />
          <stop offset="0.3" stopColor="var(--color-gold-metal-2)" />
          <stop offset="0.54" stopColor="var(--color-gold-metal-3)" />
          <stop offset="1" stopColor="var(--color-gold-metal-4)" />
        </linearGradient>
        <linearGradient
          id={flare}
          x1="202.57"
          y1="90.16"
          x2="287.63"
          y2="5.09"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.09" stopColor="var(--color-gold-metal-1)" />
          <stop offset="0.65" stopColor="var(--color-gold-metal-2)" />
          <stop offset="0.75" stopColor="var(--color-gold-metal-3)" />
          <stop offset="1" stopColor="var(--color-gold-metal-4)" />
        </linearGradient>
      </defs>
      <g data-starburst style={{ mixBlendMode: 'screen' }}>
        {STARBURST.map((d) => (
          <path key={d} d={d} fill={`url(#${flare})`} />
        ))}
      </g>
      <g data-wordmark fill={`url(#${metal})`}>
        {HONEST_LETTERS.map((d) => (
          <path key={d} d={d} />
        ))}
        {MARKETING_LETTERS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      {tagline && (
        <text
          x="149.7"
          y="112.28"
          textAnchor="middle"
          fill="var(--color-starlight)"
          className="font-[family-name:var(--next-font-mono)] uppercase"
          fontSize="8.5"
          letterSpacing="0.22em"
        >
          Powered by HONEST SuperIntelligence
        </text>
      )}
    </svg>
  )
}
