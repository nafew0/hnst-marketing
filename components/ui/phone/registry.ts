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
  /** HONEST's profile, from the CMS `socialLinks`; hidden while it has none. */
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
    place: 'dock',
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
    place: 'dock',
    opens: { kind: 'phone' },
    owner: 'astra',
    phase: 'M6',
  },
  {
    id: 'mail',
    label: 'Mail',
    name: 'Mail',
    place: 'dock',
    opens: { kind: 'route', href: '/contact' },
    owner: 'astra',
    phase: 'M6',
  },
]

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
