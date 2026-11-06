import type {
  BookingInput,
  LeadInput,
  OffersResponse,
  WallPhoto,
} from '@/lib/contracts'

/**
 * Realistic sample data for MSW mocks, tests and component previews. Prices
 * follow the Master Tier Table (DRAFT, 29 Oct 2026); live prices come from GHL
 * custom values through GET /api/v1/offers.
 */

export const sampleConsentText = {
  email:
    'I agree to receive emails from HONEST Marketing. Unsubscribe any time.',
  sms: 'I agree to receive text messages from HONEST Marketing about my enquiry. Msg & data rates may apply. Reply STOP to opt out, HELP for help.',
} as const

export const sampleLead: LeadInput = {
  type: 'contact',
  firstName: 'Avery',
  lastName: 'Stone',
  email: 'avery@example.com',
  phone: '+12025550123',
  company: 'Stone Studio',
  message: 'Interested in the Founder Package.',
  consent: {
    email: true,
    sms: false,
    emailText: sampleConsentText.email,
    smsText: sampleConsentText.sms,
  },
  utm: { source: 'linkedin', medium: 'social', campaign: 'launch' },
  pageUrl: 'https://hnst.marketing/contact',
  altcha: 'mock-altcha-payload',
}

export const sampleBooking: BookingInput = {
  slot: '2026-11-04T14:30:00-05:00',
  tz: 'America/New_York',
  contact: {
    firstName: 'Avery',
    email: 'avery@example.com',
  },
  answers: { goal: 'More qualified leads', budget: '$5k' },
  consent: {
    email: true,
    sms: false,
    emailText: sampleConsentText.email,
    smsText: sampleConsentText.sms,
  },
  utm: {},
  pageUrl: 'https://hnst.marketing/book',
  altcha: 'mock-altcha-payload',
}

export const sampleOffers: OffersResponse = {
  packages: [
    {
      tier: 'basic-diy',
      price: 500,
      value: 1500,
      turnaround: 'Self-paced course',
    },
    { tier: 'executive', price: 2500, value: 7500, turnaround: '14–21 days' },
    { tier: 'founder', price: 5000, value: 15000, turnaround: '7–14 days' },
    { tier: 'diamond', price: 25000, turnaround: '21–28 days' },
  ],
}

/**
 * Mock wall photos: brand posters, not people, each named "Sample", so mock
 * data can never pass for real visitors. 36 of them, so the album pages.
 */
const WALL_SAMPLE_IMAGES = [
  { src: '/posters/nebula.webp', width: 1600, height: 900 },
  { src: '/posters/dunes-mobile.webp', width: 780, height: 1647 },
  { src: '/posters/emblem.webp', width: 1600, height: 900 },
  { src: '/posters/glint.webp', width: 640, height: 853 },
  { src: '/posters/hero-mobile.webp', width: 780, height: 1647 },
  { src: '/posters/film-1-mobile.webp', width: 780, height: 1647 },
] as const

const WALL_SAMPLE_NEWEST = Date.parse('2026-11-06T12:00:00Z')
const HOUR_MS = 60 * 60 * 1000

export const sampleWall: WallPhoto[] = Array.from(
  { length: 36 },
  (_, index) => {
    const image =
      WALL_SAMPLE_IMAGES[index % WALL_SAMPLE_IMAGES.length] ??
      WALL_SAMPLE_IMAGES[0]
    return {
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      ...image,
      displayName: index % 3 === 2 ? null : `Sample ${index + 1}`,
      createdAt: new Date(WALL_SAMPLE_NEWEST - index * HOUR_MS).toISOString(),
    }
  }
)
