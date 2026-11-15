import type { ReactNode } from 'react'

import { Link } from '@/components/ui/link'
import { Logo } from '@/components/ui/logo'
import { STARBURST } from '@/components/ui/logo/paths'
import { colors } from '@/lib/styles/colors'

/*
 * The HONEST look for Payload's admin (/admin). Payload doesn't load the
 * site's stylesheet, so the brand palette (brand.config.ts, via
 * lib/styles/colors) is written here as CSS variables, and Payload's dark
 * theme is pointed at it: its elevation scale runs from Void to Starlight,
 * and primary buttons are gold. Registered in payload.config.ts.
 */

/** Payload's elevation steps, 0 (background) to 1000 (text). */
const STEPS = [
  0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750,
  800, 850, 900, 950, 1000,
]

const css = `
:root {
  --color-gold-metal-1: ${colors['gold-metal-1']};
  --color-gold-metal-2: ${colors['gold-metal-2']};
  --color-gold-metal-3: ${colors['gold-metal-3']};
  --color-gold-metal-4: ${colors['gold-metal-4']};
  --color-starlight: ${colors.starlight};
  --hnst-gold: ${colors.gold};
  --hnst-gold-frontier: ${colors['gold-frontier']};
  --hnst-void: ${colors.void};
  --hnst-void-2: ${colors['void-2']};
  --hnst-void-deep: ${colors['void-deep']};
  --hnst-silver: ${colors.silver};
}
html[data-theme='dark'] {
${STEPS.map(
  (step) =>
    `  --theme-elevation-${step}: color-mix(in oklab, ${colors.starlight} ${step / 10}%, ${colors['void-deep']});`
).join('\n')}
  --theme-bg: var(--hnst-void-deep);
  --theme-input-bg: var(--hnst-void);
  --theme-text: ${colors.starlight};
}
.btn--style-primary {
  --bg-color: var(--hnst-gold);
  --color: var(--hnst-void-deep);
  --hover-bg: var(--hnst-gold-frontier);
}
.hnst-logo { width: min(320px, 80vw); }
.hnst-logo text { font-family: system-ui, sans-serif; text-transform: uppercase; }
.hnst-logo svg, .hnst-icon { display: block; width: 100%; height: auto; }
.hnst-icon { width: 16px; height: 16px; } /* Payload's fixed 16 px slot */
.hnst-start { margin-bottom: 32px; padding: 24px; border: 1px solid color-mix(in oklab, var(--hnst-gold) 30%, transparent); border-radius: 16px; background: var(--hnst-void-2); }
.hnst-start h2 { margin: 0 0 4px; }
.hnst-start p { margin: 0; color: var(--hnst-silver); }
.hnst-start ul { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin: 20px 0 0; padding: 0; list-style: none; }
.hnst-start a { display: block; height: 100%; padding: 14px 16px; border: 1px solid var(--theme-elevation-150); border-radius: 12px; background: var(--hnst-void); color: inherit; text-decoration: none; }
.hnst-start a:hover, .hnst-start a:focus-visible { border-color: var(--hnst-gold); }
.hnst-start a:focus-visible { outline: 2px solid var(--hnst-gold); outline-offset: 2px; }
.hnst-start strong { display: block; color: var(--hnst-gold); }
.hnst-start span { display: block; margin-top: 4px; font-size: 13px; color: var(--hnst-silver); }
.hnst-start .hnst-note { margin-top: 20px; font-size: 13px; }
`

/** Wraps the whole admin, so the brand variables reach every screen. */
export function AdminBrandStyles({ children }: { children?: ReactNode }) {
  return (
    <>
      <style>{css}</style>
      {children}
    </>
  )
}

/** The login and sign-up screens: the gold wordmark. */
export function AdminLogo() {
  return (
    <div className="hnst-logo">
      <Logo tagline />
    </div>
  )
}

/** The navigation's small mark: the logo's crescent and starburst. */
export function AdminIcon() {
  return (
    <svg
      className="hnst-icon"
      viewBox="203 -2 98 98"
      aria-hidden="true"
      focusable="false"
    >
      {STARBURST.map((d) => (
        <path key={d} d={d} fill="var(--hnst-gold)" />
      ))}
    </svg>
  )
}

const SHORTCUTS = [
  {
    href: '/admin/collections/packages',
    title: 'Packages and prices',
    hint: 'Names, prices, delivery times. Also shown on the homepage.',
  },
  {
    href: '/admin/collections/pages',
    title: 'Pages',
    hint: 'About, How it works, Proof, Contact and the other pages.',
  },
  {
    href: '/admin/collections/faqs',
    title: 'FAQs',
    hint: 'Questions and answers on the site.',
  },
  {
    href: '/admin/globals/site-settings',
    title: 'Site settings',
    hint: 'Email, phone, social links, booking calendar, consent text.',
  },
  {
    href: '/admin/collections/wallPhotos',
    title: 'Wall photos to approve',
    hint: 'Visitors’ photos wait here until you approve them.',
  },
  {
    href: '/admin/collections/phoneNotes',
    title: 'Phone notes',
    hint: 'HONEST’s notes in the phone layout’s Notes app.',
  },
  {
    href: '/admin/collections/legal-docs',
    title: 'Legal pages',
    hint: 'Privacy, terms and the rest. Drafts until approved.',
  },
  {
    href: '/',
    title: 'View the website',
    hint: 'Opens hnst.marketing in a new tab.',
  },
] as const

/** Above the dashboard's collection cards: what most visits are for. */
export function AdminStart() {
  return (
    <section className="hnst-start" aria-labelledby="hnst-start-title">
      <h2 id="hnst-start-title">Welcome to HONEST Admin</h2>
      <p>What would you like to change?</p>
      <ul>
        {SHORTCUTS.map((item) => (
          <li key={item.href}>
            <Link href={item.href} newTab={item.href === '/'}>
              <strong>{item.title}</strong>
              <span>{item.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="hnst-note">
        Changes go live when you press Publish. The homepage’s headline text is
        part of the site’s design, so ask your developer to change it.
      </p>
    </section>
  )
}
