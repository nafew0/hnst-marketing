import type { Tier } from '@/lib/contracts'

/**
 * Homepage copy, typed and in one place until P3's CMS is merged.
 *
 * Every string here is a DRAFT: Nafew and the Founder have not approved it
 * (docs/PLAN.md § 6). Facts come from the Master Tier Table (DRAFT, 29 Oct
 * 2026); open decisions read "To be confirmed" instead of a guess. Flip
 * `copyStatus` to 'approved' once the text is signed off: the visible DRAFT
 * mark on the page goes with it.
 */

export const copyStatus: 'draft' | 'approved' = 'draft'

export const heroCopy = {
  eyebrow: 'Enter HONEST Marketing',
  lines: ['Your whole', 'marketing package.', 'Done honestly.'],
  lede: 'Brand, research, campaign, website, email and 30 days of content, produced with AI and reviewed by people. Delivered in days, not months.',
  primaryCta: { href: '/book', label: 'Book a call' },
  secondaryCta: { href: '/packages', label: 'See packages' },
} as const

/** The six deliverables on the platter, in the order the scene reveals them. */
export const platterCopy = {
  eyebrow: 'The golden platter',
  heading: 'Everything you need, served whole.',
  body: 'Six deliverables, built and connected for you. In the Founder Package, 26 specialist bots work around them.',
  deliverables: [
    {
      name: 'Brand Bible',
      description: 'Who you are and how you sound, written down.',
    },
    {
      name: 'Research Lab',
      description: 'Your market and your customers, researched.',
    },
    {
      name: 'Content calendar',
      description: 'Posts across 6–8 platforms, sized for each one.',
    },
    {
      name: 'Website',
      description: 'A full website: 24 pages in the Founder Package.',
    },
    {
      name: 'Funnel',
      description: 'A connected path from first interest to next step.',
    },
    {
      name: 'Bot',
      description: 'Specialist bots for research, strategy and content.',
    },
  ],
} as const

export interface ProcessStep {
  title: string
  description: string
}

/**
 * Typed fallback for S5 until P3's CMS is merged. The order is the plan's
 * (docs/phases/P6.md); the sentences are placeholders for Nafew's text.
 */
export const fallbackSteps: readonly ProcessStep[] = [
  {
    title: 'Questionnaire',
    description: 'You answer our questions about your business and your goals.',
  },
  {
    title: 'Bots',
    description: 'Specialist bots research, plan and draft from your answers.',
  },
  {
    title: 'Peer review',
    description: 'People check the work before you see it.',
  },
  {
    title: 'Revisions',
    description: 'You ask for changes, within your package’s revision rounds.',
  },
  {
    title: 'Handover',
    description: 'The finished package is handed over to you.',
  },
]

export const stepsCopy = {
  eyebrow: 'How it works',
  heading: 'Five steps, from first answer to handover.',
} as const

export const packagesCopy = {
  eyebrow: 'Packages',
  heading: 'Choose how much you want done for you.',
  /** P3's tool-cost text; moves to SiteSettings with the CMS. */
  disclosure:
    'Third-party tools and subscriptions are paid separately. Confirm your package’s current tool requirements and costs before purchase.',
} as const

export interface CompareRow {
  label: string
  value: string
}

/** Everything a package card shows that the offers API does not own. */
export interface PackageFacts {
  tier: Tier
  name: string
  summary: string
  /** Fallback when /api/v1/offers is down, as the contract asks. */
  price: number
  value?: number
  /** "from $25,000": Diamond starts at this price. */
  priceFrom?: boolean
  turnaround: string
  href: string
  ctaLabel: string
  highlight?: boolean
  compare: readonly CompareRow[]
}

const TO_CONFIRM = 'To be confirmed'

/** Master Tier Table (DRAFT, 29 Oct 2026). Open decisions stay "To be confirmed". */
export const homePackages: readonly PackageFacts[] = [
  {
    tier: 'basic-diy',
    name: 'Basic DIY Package',
    summary:
      'Learn the process in the HonestU course and build it yourself with six bots.',
    price: 500,
    value: 1500,
    turnaround: 'At your own pace',
    href: '/packages/basic-diy',
    ctaLabel: 'Explore Basic DIY',
    compare: [
      { label: 'Delivery', value: 'At your own pace' },
      { label: 'Bots', value: '6' },
      { label: 'Revisions', value: 'As many as it takes, by you' },
      { label: 'Website', value: 'None included' },
      { label: 'Funnels', value: 'Course section' },
    ],
  },
  {
    tier: 'executive',
    name: 'Executive Package',
    summary:
      'Brand Bible, Research Lab, one campaign, one funnel, one lead magnet and a link-in-bio site.',
    price: 2500,
    value: 7500,
    turnaround: '14–21 days after setup',
    href: '/packages/executive',
    ctaLabel: 'Explore Executive',
    compare: [
      { label: 'Delivery', value: '14–21 days after setup' },
      { label: 'Bots', value: '13' },
      { label: 'Revisions', value: TO_CONFIRM },
      { label: 'Website', value: 'Link in bio' },
      { label: 'Funnels', value: '1' },
    ],
  },
  {
    tier: 'founder',
    name: 'Founder Package',
    summary:
      'The full foundation: Brand Bible, Research Lab, one campaign, a 24-page website, two funnels and two lead magnets.',
    price: 5000,
    value: 15000,
    turnaround: '7–14 days after setup',
    href: '/packages/founder',
    ctaLabel: 'Explore the Founder Package',
    highlight: true,
    compare: [
      { label: 'Delivery', value: '7–14 days after setup' },
      { label: 'Bots', value: '26' },
      { label: 'Revisions', value: '5 rounds' },
      { label: 'Website', value: '24 pages' },
      { label: 'Funnels', value: '2' },
    ],
  },
  {
    tier: 'diamond',
    name: 'Diamond Package',
    summary:
      'Human-led delivery in Fort Lauderdale, with a 25–50-page website, three funnels and brand production.',
    price: 25000,
    priceFrom: true,
    turnaround: '21–28 days after setup',
    href: '/packages/diamond',
    ctaLabel: 'Explore Diamond',
    compare: [
      { label: 'Delivery', value: '21–28 days after setup' },
      { label: 'Bots', value: TO_CONFIRM },
      { label: 'Revisions', value: 'Unlimited' },
      { label: 'Website', value: '25–50 pages' },
      { label: 'Funnels', value: '3' },
    ],
  },
]

/** S2's three chapters, in the film's order. `end` is where its caption leaves. */
export const filmCopy = {
  title: 'Back in my day',
  chapters: [
    {
      eyebrow: 'Back in my day',
      heading: 'The overwhelm.',
      body: 'Marketing meant a pile of tools, a pile of logins and work that never quite connected.',
      still: '/posters/film-1.webp',
      stillMobile: '/posters/film-1-mobile.webp',
      alt: 'Blank cards and tangled cables tumbling through cold fog.',
      end: 0.34,
    },
    {
      eyebrow: 'Then',
      heading: 'Super Intelligence arrives.',
      body: 'The scattered pieces dissolve and find their order: a team of specialist bots, working as one.',
      still: '/posters/film-2.webp',
      stillMobile: '/posters/film-2-mobile.webp',
      alt: 'Gold particles streaming out of violet gas into a ring of bright points.',
      end: 0.68,
    },
    {
      eyebrow: 'Now',
      heading: 'The frontier.',
      body: 'What used to take a department can reach you as one finished package.',
      still: '/posters/film-3.webp',
      stillMobile: '/posters/film-3-mobile.webp',
      alt: 'Golden dunes at the end of a veil of purple gas.',
      end: 1,
    },
  ],
} as const

export const turnCopy = {
  eyebrow: 'The turn',
  heading: 'Not a marketing agency like was possible yesterday',
  statement:
    'Most agencies sell you hours. We sell you the finished package: research, brand, campaign, website, email and a month of content, built by AI agents and checked by people. You own everything we make.',
} as const

export interface ProofShot {
  label: string
  caption: string
  /** Real, labelled client-zero screenshot. Absent: an honest "pending" slate. */
  image?: { src: string; alt: string; width: number; height: number }
}

const proofShots: readonly ProofShot[] = [
  { label: 'Brand Bible', caption: 'HONEST’s own Brand Bible in Notion.' },
  { label: 'Research Lab', caption: 'HONEST’s own market research.' },
  { label: 'Pipeline', caption: 'HONEST’s own pipeline in GoHighLevel.' },
]

/**
 * S7. Nafew supplies these (docs/phases/P6.md: HONEST's real Notion and GHL,
 * with private data blurred). Until then the slates say what will go there; no
 * invented results or testimonials.
 */
export const proofCopy = {
  eyebrow: 'Proof',
  heading: 'Client zero: HONEST Marketing itself.',
  body: 'We use our own system to run our own marketing. These are the real screens from that work.',
  shots: proofShots,
  ctaHeading: 'Let’s talk about your package.',
  ctaBody: 'A short call to see which package fits, and what it would take.',
  cta: { href: '/book', label: 'Book your call' },
} as const
