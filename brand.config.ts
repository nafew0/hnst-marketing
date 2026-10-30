/**
 * HONEST Marketing brand configuration: the single source of truth for every
 * colour, gradient, WebGL look and motion timing on the site.
 *
 * Change a value here, then run `bun run setup:styles` (also run by
 * `bun run build`). That regenerates the CSS variables and Tailwind theme in
 * lib/styles/css/, and every WebGL material and shader imports from this file
 * directly, so the whole site follows.
 *
 * Colours are OKLCH because the Satus base forbids hex/rgb/hsl literals
 * (AGENTS.md § Colors). Each value converts back exactly to the hex in its
 * comment, which is the approved brand swatch. `bun run check:colors` fails
 * the build if a hex colour appears anywhere else in the codebase.
 *
 * Approved by the Founder: gold #c1b38d as the primary UI gold (29 Oct 2026).
 * Proposed, free to tune: the nebula gas shades, amber retune, semantic colours.
 */

const palette = {
  // Space core
  void: 'oklch(0.1667 0.0125 284.96)', // #0e0e14 page background
  'void-2': 'oklch(0.2215 0.0155 285.06)', // #1a1a22 surfaces, cards
  'void-3': 'oklch(0.2883 0.0145 285.46)', // #2a2a32 raised surfaces, borders
  'void-deep': 'oklch(0.1365 0.0090 285.14)', // #08080c deepest wells, footer

  // Gold (approved primary #c1b38d, 9.25:1 on void)
  gold: 'oklch(0.7689 0.0539 90.21)', // #c1b38d headings, CTAs (with void text)
  'gold-metal-1': 'oklch(0.3632 0.0484 67.72)', // #4f3921 metal shadow
  'gold-metal-2': 'oklch(0.6204 0.0499 83.07)', // #958464 metal mid
  'gold-metal-3': 'oklch(0.7689 0.0539 90.21)', // #c1b38d metal highlight
  'gold-metal-4': 'oklch(0.6078 0.0518 82.43)', // #92805f metal falloff
  'gold-frontier': 'oklch(0.6779 0.0749 67.38)', // #b78f65 Dune, secondary gold
  dust: 'oklch(0.6845 0.0638 84.76)', // #ac976c frontier support
  trail: 'oklch(0.5176 0.0915 58.39)', // #8f5a2e decorative only
  emberwood: 'oklch(0.5687 0.1054 63.47)', // #a2682c decorative only

  // Light
  starlight: 'oklch(0.9646 0.0057 84.57)', // #f5f3ef body text
  silver: 'oklch(0.7597 0.0113 286.13)', // #b0b0b8 secondary text, borders

  // Nebula gas: the purple "infinity cloud" (atmosphere only, never body text)
  'nebula-glow': 'oklch(0.6026 0.1228 298.59)', // #8b6fc0 luminous violet core
  'nebula-haze': 'oklch(0.4368 0.0507 309.43)', // #5a4a67 brand Nebula, mid haze
  'nebula-deep': 'oklch(0.2678 0.0558 299.53)', // #2a1f3d deep plum shadow
  'nebula-tint': 'oklch(0.7583 0.0913 298.77)', // #b8a4e3 lavender rim light

  // Accent and semantic
  amber: 'oklch(0.6678 0.1531 42.62)', // #e07040 ≤5% micro-highlights (retune pending)
  success: 'oklch(0.7248 0.0910 147.31)', // #7fb685
  warning: 'oklch(0.7596 0.1382 70.35)', // #e8a040
  danger: 'oklch(0.6484 0.1456 27.89)', // #d9675b
} as const

/** Theme roles consumed by Satus components (`--color-primary` etc.). */
const themes = {
  // Default: Void background, Starlight text, Gold accents.
  dark: {
    primary: palette.void,
    secondary: palette.starlight,
    contrast: palette.gold,
  },
  // Light pages (error view, legal print): Starlight background, deep metal gold.
  light: {
    primary: palette.starlight,
    secondary: palette.void,
    contrast: palette['gold-metal-1'],
  },
  // Frontier chapters: deepest Void with the warmer Dune gold.
  frontier: {
    primary: palette['void-deep'],
    secondary: palette.starlight,
    contrast: palette['gold-frontier'],
  },
} as const

const gradients = {
  // Hero space: plum shadow into violet glow.
  nebulaSunset: [palette['nebula-haze'], palette.amber],
  voidDepth: [palette.void, palette['nebula-haze']],
  nebulaGas: [
    palette['nebula-deep'],
    palette['nebula-haze'],
    palette['nebula-glow'],
  ],
  frontierLight: [palette.trail, palette['gold-frontier'], palette.starlight],
  goldMetal: [
    palette['gold-metal-1'],
    palette['gold-metal-2'],
    palette['gold-metal-3'],
    palette['gold-metal-4'],
  ],
} as const

/**
 * Font families. `next/font` needs static calls, so the loader lives in
 * lib/styles/fonts.ts; these names document the choice and drive fallbacks.
 * Licensed upgrade path: Bodoni URW / Helvetica Neue LT Pro / Anzeigen
 * Grotesk via self-hosted files once the web licences are confirmed.
 */
const fonts = {
  display: { family: 'Bodoni Moda', fallback: ['Georgia', 'serif'] },
  body: { family: 'Inter', fallback: ['system-ui', 'sans-serif'] },
  button: {
    family: 'Archivo Narrow',
    fallback: ['Arial Narrow', 'sans-serif'],
  },
} as const

/** WebGL look. Shaders and materials read these, not literals. */
const three = {
  goldRoughness: 0.25,
  goldClearcoat: 0.4,
  bloomStrength: 0.4,
  nebulaSpeed: 0.03,
  nebulaDensity: 1,
  maxDprDesktop: 1.5,
  maxDprMobile: 1.25,
} as const

/** Motion timings (ms) and anime.js ease names shared by every animation. */
const motion = {
  durFast: 300,
  durBase: 700,
  durSlow: 1400,
  stagger: 80,
  ease: 'out(3)',
  easeInOut: 'inOut(3)',
} as const

export const brand = {
  palette,
  themes,
  gradients,
  fonts,
  three,
  motion,
} as const
export type BrandColor = keyof typeof palette
export type BrandTheme = keyof typeof themes
