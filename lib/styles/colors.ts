import { brand } from '@/brand.config'

// The palette and themes are defined in brand.config.ts (HONEST Marketing).
// Do not author colours here: edit brand.config.ts and run
// `bun run setup:styles`, which generates the CSS variables and Tailwind
// theme from these exports.
const colors = brand.palette

const themeNames = ['dark', 'light', 'frontier'] as const
const colorNames = ['primary', 'secondary', 'contrast'] as const

const themes = brand.themes satisfies Themes

export { colors, themeNames, themes }

export type Themes = Record<
  (typeof themeNames)[number],
  Record<(typeof colorNames)[number], string>
>
