import type { Tier } from '@/lib/contracts'

/**
 * Homepage copy, typed and in one place until P3's CMS is merged.
 *
 * The wording is HonestMarketing AI/HONEST-Website-Wave3-Inputs.md § 2. Every
 * string is a DRAFT: none of it is Founder-approved, and several lines depend on
 * the open decisions in § 1 of that file (listed in the PR). Open facts read "To
 * be confirmed" instead of a guess. Flip `copyStatus` to 'approved' once the text
 * is signed off: the visible DRAFT mark on the page goes with it.
 */

export const copyStatus: 'draft' | 'approved' = 'draft'

export const heroCopy = {
  eyebrow: 'Enter HONEST Marketing',
  lines: ['Your marketing,', 'on a golden platter.'],
  lede: 'A complete marketing and AI system, built from your answers to a series of questions. Delivered ready to run. Yours to keep and own outright.',
  primaryCta: { href: '/book', label: 'Book a call' },
  secondaryCta: { href: '/packages', label: 'See packages' },
} as const

/** The six deliverables on the platter, in the order the scene reveals them. */
export const platterCopy = {
  eyebrow: 'Done For You',
  heading: 'Everything on a golden platter.',
  body: 'When others say Done For You, they really mean “kinda”. You still have to execute the tasks and make the biggest decisions. Here, it all comes from a series of questions.',
  note: 'Shown: the Founder Package. What’s included varies by package.',
  deliverables: [
    { name: 'Brand Bible', description: 'Your brand, documented' },
    { name: 'Research Lab', description: 'Your market, researched' },
    { name: 'Content calendar', description: '6–8 platforms, 2 posts a day' },
    {
      name: 'Website',
      description: '24 pages, 5 forms, payment and calendar setup',
    },
    { name: 'Funnels', description: '2 funnels, 2 lead magnets' },
    { name: 'Bots', description: '26 Super Intelligence bot templates' },
  ],
} as const

export interface ProcessStep {
  title: string
  description: string
}

/** Typed fallback for S5 until P3's CMS is merged. */
export const fallbackSteps: readonly ProcessStep[] = [
  {
    title: 'Answer the questions',
    description:
      'Answer the questionnaire and upload every marketing asset you can get your hands on. This part runs at your pace.',
  },
  {
    title: 'The bots go to work',
    description:
      'Once your answers are in, our Super Intelligence bot teams take over the execution.',
  },
  {
    title: 'Peer review',
    description:
      'When the assets are ready, you get a Deliverables Peer-Review Sheet. Go through each asset critically: what’s wrong, what has to change, what perfect looks like.',
  },
  {
    title: 'Revisions',
    description:
      'We revise every mark and resubmit with a new sheet. Anything you don’t flag as work in progress counts as accepted, so treat each draft as if it were the final.',
  },
  {
    title: 'Handover',
    description:
      'Final assets are packaged and delivered, and ownership of everything we created transfers to you.',
  },
]

export const stepsCopy = {
  // § 2 gives this section no headline, so it carries its own name.
  heading: 'How it works',
  note: 'Basic DIY is a self-paced course: you run these steps yourself.',
} as const

export const packagesCopy = {
  eyebrow: 'The packages',
  heading: 'Pick how much you want done for you.',
  toolCosts:
    'Tools are billed to you directly by their providers and aren’t included in the package price: Google Workspace $8.40/month per seat, X or Grok about $8–$200/month, GoHighLevel $97/month. That’s about $115–$310/month in total.',
  terms:
    'No refunds and no guarantees: see each package’s terms. Results depend on your commitment and creativity in answering the questions.',
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
  /** Small label above the name, for the highlighted package. */
  badge?: string
  compare: readonly CompareRow[]
}

const TO_CONFIRM = 'To be confirmed'

/** Master Tier Table (DRAFT, 29 Oct 2026). Open decisions stay "To be confirmed". */
export const homePackages: readonly PackageFacts[] = [
  {
    tier: 'basic-diy',
    name: 'Basic DIY',
    summary: 'Learn it and build it yourself: the course and 6 bot templates.',
    price: 500,
    value: 1500,
    turnaround: 'Your own pace',
    href: '/packages/basic-diy',
    ctaLabel: 'Explore Basic DIY',
    compare: [
      { label: 'Delivery', value: 'Your own pace' },
      { label: 'Bot templates', value: '6' },
      { label: 'Revisions', value: 'As many as it takes, by you' },
      { label: 'Website', value: 'None included' },
      { label: 'Funnels', value: 'Course section' },
    ],
  },
  {
    tier: 'executive',
    name: 'Executive',
    summary:
      'Done for you: Brand Bible, Research Lab, one campaign, one funnel, a link-in-bio site and 13 bot templates.',
    price: 2500,
    value: 7500,
    turnaround: '14–21 days after setup',
    href: '/packages/executive',
    ctaLabel: 'Explore Executive',
    compare: [
      { label: 'Delivery', value: '14–21 days after setup' },
      { label: 'Bot templates', value: '13' },
      { label: 'Revisions', value: TO_CONFIRM },
      { label: 'Website', value: 'Link in bio' },
      { label: 'Funnels', value: '1' },
    ],
  },
  {
    tier: 'founder',
    name: 'Founder Package',
    summary:
      'Done for you, in half the execution time of Executive: a 24-page website, 2 funnels and 26 bot templates.',
    price: 5000,
    value: 15000,
    turnaround: '7–14 days after setup',
    href: '/packages/founder',
    ctaLabel: 'Explore the Founder Package',
    highlight: true,
    badge: 'Our lead offer',
    compare: [
      { label: 'Delivery', value: '7–14 days after setup' },
      { label: 'Bot templates', value: '26' },
      { label: 'Revisions', value: '5 rounds' },
      { label: 'Website', value: '24 pages' },
      { label: 'Funnels', value: '2' },
    ],
  },
  {
    tier: 'diamond',
    name: 'Diamond',
    summary:
      'Human-led, in person in Fort Lauderdale (Las Olas): a 25–50 page website, 3 funnels, and photo and video shoots.',
    price: 25000,
    priceFrom: true,
    turnaround: '21–28 days after setup',
    href: '/packages/diamond',
    ctaLabel: 'Explore Diamond',
    compare: [
      { label: 'Delivery', value: '21–28 days after setup' },
      { label: 'Bot templates', value: TO_CONFIRM },
      { label: 'Revisions', value: 'Unlimited' },
      { label: 'Website', value: '25–50 pages' },
      { label: 'Funnels', value: '3' },
    ],
  },
]

/**
 * S2. `end` is where a caption leaves, in film progress: 2023 and 2026 play over
 * the clutter, and "Then" from the moment it starts to dissolve until the dunes.
 */
export const filmCopy = {
  title: 'Back in my day',
  pinnedLine:
    'Back in my day, we used to struggle with marketing our business.',
  chapters: [
    {
      label: '2023',
      body: 'You stumble across ChatGPT for the very first time. It’s an insane piece of technology. You haven’t a clue how to use it in your business.',
      still: '/posters/film-1.webp',
      stillMobile: '/posters/film-1-mobile.webp',
      alt: 'Blank cards and tangled lines drifting in cold fog.',
      end: 0.17,
    },
    {
      label: '2026',
      body: 'Technology has advanced. You know how much it should be helping you. But you’re overwhelmed, the FOMO keeps building, and you’re still struggling to market.',
      still: '/posters/film-2.webp',
      stillMobile: '/posters/film-2-mobile.webp',
      alt: 'A dense tumble of coloured cards and tangled lines.',
      end: 0.36,
    },
    {
      label: 'Then',
      body: 'A young, vivacious entrepreneur walks up. Without saying a word, hands you a complete content calendar and a top-to-bottom audit of everything public about your business. It came to you. Almost as if it already knew everything about you.',
      still: '/posters/film-3.webp',
      stillMobile: '/posters/film-3-mobile.webp',
      alt: 'Gold points of light settling into a ring among stars and gas.',
      end: 1,
    },
  ],
} as const

export const turnCopy = {
  heading: 'Not a marketing agency like was possible yesterday.',
  body: 'Just a few short months ago, marketing was laborious and no one understood it. For those failing to adapt, it still is. We used to charge $25k+ for the same systems and, believe it or not, we did it all by hand.',
  closing: 'Today is the day that changed.',
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
  eyebrow: 'Client zero',
  heading: 'HONEST Marketing itself.',
  body: 'No testimonials here, because we won’t invent any. So here’s the real thing: the Notion and GoHighLevel system we run on.',
  shots: proofShots,
  ctaHeading: 'I’m ready when you are.',
  cta: { href: '/book', label: 'Book your call' },
} as const
