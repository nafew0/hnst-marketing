import cn from 'clsx'
import { type ComponentProps, useId } from 'react'

interface HorizonDividerProps extends Omit<ComponentProps<'svg'>, 'children'> {
  /** Starburst flare where the light hits the horizon. */
  flare?: boolean
}

/**
 * Section divider: a planet's horizon traced by a hairline of gold light,
 * fading out at both ends (the hero's planet-rim motif). The arc carries
 * `data-draw`, so `useDrawPath` can draw it in. Decorative: hidden from
 * assistive tech.
 */
export function HorizonDivider({
  flare = true,
  className,
  ...props
}: HorizonDividerProps) {
  const id = useId()
  const fade = `${id}-fade`
  const glow = `${id}-glow`

  return (
    <svg
      viewBox="0 0 1200 80"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn('block h-auto w-full overflow-visible', className)}
      {...props}
    >
      <defs>
        <linearGradient id={fade} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--color-gold)" stopOpacity="0" />
          <stop offset="0.35" stopColor="var(--color-gold-metal-2)" />
          <stop offset="0.5" stopColor="var(--color-gold)" />
          <stop offset="0.65" stopColor="var(--color-gold-metal-2)" />
          <stop offset="1" stopColor="var(--color-gold)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={glow}>
          <stop offset="0" stopColor="var(--color-starlight)" />
          <stop offset="0.25" stopColor="var(--color-gold)" stopOpacity="0.6" />
          <stop offset="1" stopColor="var(--color-gold)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        data-draw
        pathLength={1}
        d="M0 78 Q600 -6 1200 78"
        fill="none"
        stroke={`url(#${fade})`}
        strokeWidth="1.25"
        vectorEffect="non-scaling-stroke"
      />
      {flare && (
        <ellipse
          data-flare
          cx="600"
          cy="36"
          rx="90"
          ry="10"
          fill={`url(#${glow})`}
        />
      )}
    </svg>
  )
}
