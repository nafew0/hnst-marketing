import type { RequiredDataFromCollectionSlug } from 'payload'
export const packageSeeds: RequiredDataFromCollectionSlug<'packages'>[] = [
  {
    tier: 'basic-diy',
    slug: 'basic-diy',
    name: 'Basic DIY Package',
    price: 500,
    valueLabel: '$1,500 value',
    turnaround: 'At your own pace',
    revisions: 'Self-directed',
    bots: 6,
    order: 1,
    highlight: false,
    ctaLabel: 'Explore Basic DIY',
    ctaType: 'contact',
    _status: 'published',
    deliverables: [
      {
        title: 'HonestU course',
        description:
          'Learn the process and build your marketing system yourself.',
      },
      {
        title: 'Six specialist bots',
        description:
          'Research, strategy, content creation, editing, social media and a Chief of Staff.',
      },
    ],
  },
  {
    tier: 'executive',
    slug: 'executive',
    name: 'Executive Package',
    price: 2500,
    valueLabel: '$7,500 value',
    turnaround: '14–21 days after setup',
    revisions: 'To be confirmed',
    bots: 13,
    order: 2,
    highlight: false,
    ctaLabel: 'Explore Executive',
    ctaType: 'contact',
    _status: 'published',
    deliverables: [
      {
        title: 'Brand Bible & Research Lab',
        description: 'Your positioning and market research, brought together.',
      },
      {
        title: 'Campaign & funnel',
        description: 'One marketing campaign, one funnel and one lead magnet.',
      },
      {
        title: 'Link-in-bio website',
        description:
          'A focused home for your links, plus the Executive course.',
      },
    ],
  },
  {
    tier: 'founder',
    slug: 'founder',
    name: 'Founder Package',
    price: 5000,
    valueLabel: '$15,000 value',
    turnaround: '7–14 days after setup',
    revisions: '5 rounds',
    bots: 26,
    order: 3,
    highlight: true,
    ctaLabel: 'Explore the Founder Package',
    ctaType: 'contact',
    _status: 'published',
    deliverables: [
      {
        title: 'Your complete foundation',
        description: 'Brand Bible, Research Lab and one marketing campaign.',
      },
      {
        title: '24-page website',
        description:
          'Five forms, payment and calendar setup, plus a link-in-bio page.',
      },
      {
        title: 'Two funnels. Two lead magnets.',
        description:
          'A connected path from first interest to the next conversation.',
      },
      {
        title: 'Content & handover',
        description:
          'Two posts a day across 6–8 platforms, Founder course access and five revision rounds.',
      },
    ],
  },
  {
    tier: 'diamond',
    slug: 'diamond',
    name: 'Diamond Package',
    price: 25000,
    turnaround: '21–28 days after setup',
    revisions: 'Unlimited',
    order: 4,
    highlight: false,
    ctaLabel: 'Explore Diamond',
    ctaType: 'contact',
    _status: 'published',
    deliverables: [
      {
        title: 'In-person collaboration',
        description: 'Human-led delivery in Fort Lauderdale, Las Olas.',
      },
      {
        title: 'Expanded website & funnels',
        description:
          'A 25–50-page website, three funnels and three lead magnets.',
      },
      {
        title: 'Brand production',
        description:
          'Brand photos, reels, long-form video and a human-led course.',
      },
    ],
  },
]
export const legalSlugs = [
  'privacy',
  'terms',
  'sms',
  'basic-diy-terms',
  'executive-terms',
  'founder-terms',
  'diamond-terms',
] as const
export function richText(text: string) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: null,
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: null,
          children: [
            {
              type: 'text',
              text,
              format: 0,
              detail: 0,
              mode: 'normal',
              style: '',
              version: 1,
            },
          ],
        },
      ],
    },
  }
}
