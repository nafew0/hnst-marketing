import { Archivo_Narrow, Bodoni_Moda, Inter } from 'next/font/google'

// HONEST Marketing type system (brand.config.ts § fonts). next/font/google
// downloads each family at build time and serves it from this site, so no
// request reaches Google at runtime. These are free OFL stand-ins for the
// licensed Bodoni URW / Helvetica Neue LT Pro / Anzeigen Grotesk; swap the
// imports here once the web licences are confirmed (next/font needs static
// calls, so the family cannot be read from brand.config.ts).
//
// No `weight`: all three ship a variable `wght` axis, so one file per family
// covers every weight. All three are above the fold, so they keep the default
// preload (AGENTS.md § Fonts).
const display = Bodoni_Moda({
  subsets: ['latin'],
  display: 'swap',
  variable: '--next-font-display',
  fallback: ['Georgia', 'serif'],
})

const body = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--next-font-body',
  fallback: ['system-ui', 'sans-serif'],
})

// The `mono` slot keeps Satus's UI-font name (header, footer, labels,
// buttons) but carries the narrow grotesk used for HONEST buttons and links.
const mono = Archivo_Narrow({
  subsets: ['latin'],
  display: 'swap',
  variable: '--next-font-mono',
  fallback: ['Arial Narrow', 'sans-serif'],
})

const fonts = [display, body, mono]
const fontsVariable = fonts.map((font) => font.variable).join(' ')

export { fontsVariable }
