/**
 * Every app on the phone home screen (docs/phases/M1.md). One list, read by
 * the home screen, its dock, the `?app=` views and notifications, so an app is
 * added in one place. Data only: no components, so Server Components can read
 * it. The design and its decisions: HONEST-Mobile-iOS-Plan.md (6 Nov 2026).
 */

export const SOCIAL_NETWORKS = [
  'instagram',
  'x',
  'youtube',
  'tiktok',
  'linkedin',
] as const
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number]

export type PhoneAppId =
  | 'honest'
  | 'calendar'
  | 'camera'
  | 'packages'
  | 'how-it-works'
  | 'about'
  | 'marketer'
  | SocialNetwork
  | 'photos'
  | 'browser'
  | 'notes'
  | 'mail'

/** Phone-only apps: views at `/?app=<id>`, kept out of search (canonical `/`). */
export type PhoneOnlyAppId = 'camera' | 'notes'

export type PhoneAppOpens =
  /** The homepage story, already in the HTML under the home screen. */
  | { kind: 'story' }
  /** A page with its own URL, opened as a window (P7W) in the phone skin. */
  | { kind: 'route'; href: string }
  /** A view that exists only on the phone. */
  | { kind: 'phone' }
  /** The classic website: today's mobile pages, without the phone layout. */
  | { kind: 'classic' }
  /**
   * HONEST's profile from the CMS `socialLinks`, or the network's home page
   * until it has one (`socialUrl`). Always a new tab.
   */
  | { kind: 'social'; network: SocialNetwork }

export interface PhoneApp {
  id: PhoneAppId
  /** Under the icon on the grid. Dock icons show no label, as on iOS. */
  label: string
  /** The accessible name. */
  name: string
  place: 'grid' | 'dock'
  opens: PhoneAppOpens
  /** Who builds the app's own view, and in which phase. */
  owner: 'claude' | 'astra'
  phase: 'M2' | 'M5' | 'M6' | 'M7'
}

const social = (network: SocialNetwork, label: string): PhoneApp => ({
  id: network,
  label,
  name: `HONEST on ${label}`,
  place: 'grid',
  opens: { kind: 'social', network },
  owner: 'claude',
  phase: 'M2',
})

export const PHONE_APPS: readonly PhoneApp[] = [
  {
    id: 'honest',
    label: 'HONEST',
    name: 'HONEST',
    place: 'grid',
    opens: { kind: 'story' },
    owner: 'claude',
    phase: 'M2',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    name: 'Calendar: book a call',
    place: 'grid',
    opens: { kind: 'route', href: '/book' },
    owner: 'astra',
    phase: 'M6',
  },
  {
    id: 'camera',
    label: 'Camera',
    name: 'Camera',
    place: 'grid',
    opens: { kind: 'phone' },
    owner: 'claude',
    phase: 'M7',
  },
  {
    id: 'packages',
    label: 'Packages',
    name: 'Packages',
    place: 'grid',
    opens: { kind: 'route', href: '/packages' },
    owner: 'claude',
    phase: 'M5',
  },
  {
    id: 'how-it-works',
    label: 'How it works',
    name: 'How it works',
    place: 'grid',
    opens: { kind: 'route', href: '/how-it-works' },
    owner: 'claude',
    phase: 'M5',
  },
  {
    id: 'about',
    label: 'About',
    name: 'About',
    place: 'grid',
    opens: { kind: 'route', href: '/about' },
    owner: 'claude',
    phase: 'M5',
  },
  {
    id: 'marketer',
    label: 'HONEST Marketer',
    name: 'The HONEST Marketer',
    place: 'grid',
    opens: { kind: 'route', href: '/the-honest-marketer' },
    owner: 'claude',
    phase: 'M5',
  },
  social('instagram', 'Instagram'),
  social('x', 'X'),
  social('youtube', 'YouTube'),
  social('tiktok', 'TikTok'),
  social('linkedin', 'LinkedIn'),
  {
    id: 'photos',
    label: 'Photos',
    name: 'Photos',
    place: 'grid',
    opens: { kind: 'route', href: '/proof' },
    owner: 'claude',
    phase: 'M5',
  },
  {
    id: 'browser',
    label: 'Website',
    name: 'Classic website',
    place: 'dock',
    opens: { kind: 'classic' },
    owner: 'claude',
    phase: 'M5',
  },
  {
    id: 'notes',
    label: 'Notes',
    name: 'Notes',
    place: 'grid',
    opens: { kind: 'phone' },
    owner: 'astra',
    phase: 'M6',
  },
  // The contact form (M6). Its id stays `mail`: the CMS stores notification
  // apps by id. "Mail" on the dock is the visitor's own mail app (PHONE_LINKS).
  {
    id: 'mail',
    label: 'Contact',
    name: 'Contact',
    place: 'grid',
    opens: { kind: 'route', href: '/contact' },
    owner: 'astra',
    phase: 'M6',
  },
]

/**
 * The grid, top to bottom. The registry's own order is what the CMS lists as
 * notification apps (its select is built from PHONE_APPS), so layout lives here.
 */
export const GRID: readonly PhoneAppId[] = [
  'honest',
  'calendar',
  'camera',
  'packages',
  'how-it-works',
  'about',
  'marketer',
  'photos',
  'notes',
  'mail',
  ...SOCIAL_NETWORKS,
]

/** How the visitor reaches HONEST directly: their phone's own apps. */
export type ContactChannel = 'phone' | 'sms' | 'email'

/**
 * Icons that hand the visitor to their phone's own Phone, Messages and Mail.
 * Not apps: nothing opens on the site, and no notification points at them, so
 * they stay out of PHONE_APPS (and out of the CMS's list).
 */
export interface PhoneLink {
  id: 'phone' | 'messages' | 'email'
  label: string
  /** The accessible name, before the number or address. */
  name: string
  channel: ContactChannel
}

export const PHONE_LINKS: readonly PhoneLink[] = [
  { id: 'phone', label: 'Phone', name: 'Call HONEST', channel: 'phone' },
  { id: 'messages', label: 'Messages', name: 'Text HONEST', channel: 'sms' },
  { id: 'email', label: 'Mail', name: 'Email HONEST', channel: 'email' },
]

export type DockId = PhoneAppId | PhoneLink['id']

/** The dock, left to right, as on an iPhone. */
export const DOCK: readonly DockId[] = ['phone', 'browser', 'messages', 'email']

export function isPhoneLinkId(id: DockId): id is PhoneLink['id'] {
  return PHONE_LINKS.some((link) => link.id === id)
}

export function phoneLink(id: PhoneLink['id']) {
  const link = PHONE_LINKS.find((candidate) => candidate.id === id)
  if (!link) throw new Error(`Unknown phone link: ${id}`)
  return link
}

/** HONEST's public email and phone: the CMS's, or these until it has them. */
export interface SiteContact {
  email: string
  phone: string
}

/** `phone` is a placeholder until HONEST has a number (7 Nov 2026). */
export const CONTACT_FALLBACK: SiteContact = {
  email: 'service@hnst.marketing',
  phone: '+123456789',
}

/** The CMS's values where set, the fallback where not. */
export function siteContact(cms: {
  email?: string | null | undefined
  phone?: string | null | undefined
}): SiteContact {
  return {
    email: cms.email?.trim() || CONTACT_FALLBACK.email,
    phone: cms.phone?.trim() || CONTACT_FALLBACK.phone,
  }
}

/** The link that opens the visitor's own app for a channel. */
export function contactHref(channel: ContactChannel, contact: SiteContact) {
  // Only digits and a leading plus survive in tel: and sms: links.
  const number = contact.phone.replaceAll(/[^\d+]/gu, '')
  if (channel === 'phone') return `tel:${number}`
  if (channel === 'sms') return `sms:${number}`
  return `mailto:${contact.email}`
}

/** What the accessible name adds: the number, or the address. */
export function contactDetail(channel: ContactChannel, contact: SiteContact) {
  return channel === 'email' ? contact.email : contact.phone
}

export function phoneApp(id: PhoneAppId) {
  const app = PHONE_APPS.find((candidate) => candidate.id === id)
  if (!app) throw new Error(`Unknown phone app: ${id}`)
  return app
}

/** The query parameter that opens a phone-only app over the home screen. */
export const APP_PARAM = 'app'

export function isPhoneOnlyApp(id: string | null): id is PhoneOnlyAppId {
  return PHONE_APPS.some((app) => app.id === id && app.opens.kind === 'phone')
}

/** Where a phone-only app lives: `/?app=camera`. */
export function phoneOnlyHref(id: PhoneOnlyAppId) {
  return `/?${new URLSearchParams({ [APP_PARAM]: id })}`
}

const SOCIAL_HOSTS = {
  instagram: ['instagram.com'],
  x: ['x.com', 'twitter.com'],
  youtube: ['youtube.com', 'youtu.be'],
  tiktok: ['tiktok.com'],
  linkedin: ['linkedin.com'],
} as const satisfies Record<SocialNetwork, readonly string[]>

/** Each network's home page, until the CMS has HONEST's profile there. */
export const SOCIAL_HOME = {
  instagram: 'https://www.instagram.com/',
  x: 'https://x.com/',
  youtube: 'https://www.youtube.com/',
  tiktok: 'https://www.tiktok.com/',
  linkedin: 'https://www.linkedin.com/',
} as const satisfies Record<SocialNetwork, string>

/** HONEST's profile on a network, from the CMS links, or the network's home. */
export function socialUrl(
  network: SocialNetwork,
  links: readonly { url: string }[]
) {
  return (
    links.find((link) => socialNetworkOf(link.url) === network)?.url ??
    SOCIAL_HOME[network]
  )
}

/** Which network a CMS social link points at, judged by its host. */
export function socialNetworkOf(url: string): SocialNetwork | undefined {
  let host: string
  try {
    host = new URL(url).hostname.replace(/^www\./u, '')
  } catch {
    return undefined
  }
  return SOCIAL_NETWORKS.find((network) =>
    SOCIAL_HOSTS[network].some(
      (known) => host === known || host.endsWith(`.${known}`)
    )
  )
}

/**
 * The phone's name for a page: its app's label ("Photos" for `/proof`), or
 * the page's own title when no app owns it. Tier pages keep their own name.
 */
export function phoneTitle(href: string, pageTitle: string) {
  const app = PHONE_APPS.find(
    (candidate) =>
      candidate.opens.kind === 'route' && candidate.opens.href === href
  )
  return app?.label ?? pageTitle
}
