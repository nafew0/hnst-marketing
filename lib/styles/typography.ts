import type { CSSProperties } from 'react'

// Font slots map to the CSS variables set in fonts.ts. `mono` is Satus's UI
// slot name; for HONEST it carries the narrow grotesk used for buttons, nav
// and labels (see brand.config.ts § fonts).
const fonts = {
  display: '--next-font-display', // Bodoni Moda: headlines
  body: '--next-font-body', // Inter: paragraphs
  mono: '--next-font-mono', // Archivo Narrow: buttons, links, labels
} as const

// Sizes are px at the 375px mobile and 1440px desktop design widths; the
// generated dr-text-* utilities scale them with the viewport.
const typography = {
  display: {
    'font-family': `var(${fonts.display})`,
    'font-style': 'normal',
    'font-weight': 500,
    'line-height': '96%',
    'letter-spacing': '-0.025em',
    'font-size': { mobile: 52, desktop: 128 },
  },
  h1: {
    'font-family': `var(${fonts.display})`,
    'font-style': 'normal',
    'font-weight': 500,
    'line-height': '102%',
    'letter-spacing': '-0.02em',
    'font-size': { mobile: 44, desktop: 88 },
  },
  h2: {
    'font-family': `var(${fonts.display})`,
    'font-style': 'normal',
    'font-weight': 500,
    'line-height': '106%',
    'letter-spacing': '-0.015em',
    'font-size': { mobile: 32, desktop: 56 },
  },
  h3: {
    'font-family': `var(${fonts.display})`,
    'font-style': 'normal',
    'font-weight': 500,
    'line-height': '115%',
    'letter-spacing': '-0.01em',
    'font-size': { mobile: 24, desktop: 32 },
  },
  h4: {
    'font-family': `var(${fonts.display})`,
    'font-style': 'normal',
    'font-weight': 500,
    'line-height': '125%',
    'letter-spacing': '0em',
    'font-size': { mobile: 20, desktop: 24 },
  },
  'p-big': {
    'font-family': `var(${fonts.body})`,
    'font-style': 'normal',
    'font-weight': 400,
    'line-height': '150%',
    'letter-spacing': '-0.005em',
    'font-size': { mobile: 18, desktop: 22 },
  },
  p: {
    'font-family': `var(${fonts.body})`,
    'font-style': 'normal',
    'font-weight': 400,
    'line-height': '160%',
    'letter-spacing': '0em',
    'font-size': { mobile: 16, desktop: 17 },
  },
  caption: {
    'font-family': `var(${fonts.body})`,
    'font-style': 'normal',
    'font-weight': 400,
    'line-height': '140%',
    'letter-spacing': '0.01em',
    'font-size': { mobile: 12, desktop: 13 },
  },
  eyebrow: {
    'font-family': `var(${fonts.mono})`,
    'font-style': 'normal',
    'font-weight': 600,
    'line-height': '100%',
    'letter-spacing': '0.18em',
    'font-size': { mobile: 12, desktop: 13 },
  },
  cta: {
    'font-family': `var(${fonts.mono})`,
    'font-style': 'normal',
    'font-weight': 600,
    'line-height': '100%',
    'letter-spacing': '0.06em',
    'font-size': { mobile: 15, desktop: 16 },
  },
  link: {
    'font-family': `var(${fonts.mono})`,
    'font-style': 'normal',
    'font-weight': 500,
    'line-height': '100%',
    'letter-spacing': '0.03em',
    'font-size': { mobile: 15, desktop: 15 },
  },
} as const satisfies TypeStyles

export { fonts, typography }

type TypeStyles = Record<
  string,
  {
    'font-family': string
    'font-style': CSSProperties['fontStyle']
    'font-weight': CSSProperties['fontWeight']
    'line-height':
      | `${number}%`
      | { mobile: `${number}%`; desktop: `${number}%` }
    'letter-spacing':
      | `${number}em`
      | { mobile: `${number}em`; desktop: `${number}em` }
    'font-feature-settings'?: string
    'font-size': number | { mobile: number; desktop: number }
  }
>
