/**
 * Site navigation, shared by the header, the mobile drawer and the footer.
 * Routes are built in P3/P6 (docs/PLAN.md § 1); until then they 404 in dev.
 * Owned by Claude (CODEOWNERS): request changes in your PR description.
 */

export interface NavItem {
  href: string
  label: string
}

export const primaryNav: readonly NavItem[] = [
  { href: '/packages', label: 'Packages' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/proof', label: 'Proof' },
  { href: '/about', label: 'About' },
]

export const bookCall: NavItem = { href: '/book', label: 'Book a call' }

export const legalNav: readonly NavItem[] = [
  { href: '/legal/privacy', label: 'Privacy' },
  { href: '/legal/terms', label: 'Terms' },
  { href: '/legal/sms', label: 'SMS terms' },
]

export const footerNav: readonly NavItem[] = [
  ...primaryNav,
  { href: '/the-honest-marketer', label: 'The HONEST Marketer' },
  { href: '/contact', label: 'Contact' },
]
