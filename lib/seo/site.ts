import { APP_BASE_URL } from '@/lib/env'

export interface AgentUseCase {
  /** Short job name that an agent can match against its task. */
  name: string
  /** Concrete boundary for when this site or product is a good fit. */
  description: string
}

export interface AgentGuidance {
  whenToUse: readonly AgentUseCase[]
  /** Ordered instructions for starting or continuing the job. */
  howToUse: readonly string[]
}

export interface DeveloperResource {
  name: string
  description: string
  /** Absolute URL so the resource also works outside the rendered site. */
  url: string
}

export interface SiteFacts {
  /** Display name, exactly as it should be cited. */
  name: string
  /** Other spellings people search for (casing variants, abbreviations). */
  alternateNames: readonly string[]
  url: string
  /** Absolute URL: relative paths are ignored by most consumers. */
  logo: string
  /** One or two sentences: who, where, for whom. Answers "what is X?". */
  description: string
  /** ISO year or date. */
  foundingDate?: string
  /** Human-readable location, e.g. 'Buenos Aires, Argentina'. */
  locationName?: string
  /** ISO 3166-1 alpha-2, e.g. 'AR'. */
  addressCountry?: string
  areaServed?: string
  /** What you sell, in the words a buyer would use. */
  services: readonly string[]
  /** Feeds schema.org `knowsAbout`. */
  knowsAbout: readonly string[]
  email?: string
  /** Profile URLs; feeds schema.org `sameAs`. */
  sameAs: readonly string[]
  /** Omit when the site is not callable. */
  agentGuidance?: AgentGuidance
  /** Real, public resources only; never list a surface that is not shipped. */
  developerResources?: readonly DeveloperResource[]
}

/**
 * Normalized `APP_BASE_URL` that every absolute URL derives from. Strips the
 * trailing slash `z.url()` permits; otherwise concatenation emits
 * `//icon.png` and a JSON-LD `@id` that no longer matches the other nodes.
 */
export const BASE_URL = APP_BASE_URL.replace(/\/+$/, '')

/**
 * Single source of truth for entity copy: JSON-LD, crawlable "about" prose and
 * `/llms.txt` all read it. Hardcoded on purpose: answer engines cite plain
 * text, so empty values leave the site with no citable identity (back it with
 * a CMS singleton, keeping these as fallbacks, if editors must own it). Replace
 * every value before launch, in phrasing that doesn't go stale.
 */
export const SITE: SiteFacts = {
  name: 'HONEST Marketing',
  alternateNames: ['HNST Marketing', 'Honest Marketing'],
  url: BASE_URL,
  // Replace with the HONEST emblem PNG before launch (P9), or the
  // Organization schema advertises the starter icon.
  logo: `${BASE_URL}/icon.png`,
  // DRAFT copy, pending Founder sign-off (P9 owns final SEO copy).
  description:
    'HONEST Marketing delivers complete marketing packages (brand bible, market research, campaign, website, email and a 30-day content plan) produced with AI and reviewed by people, for founders who want it done in days, not months.',
  areaServed: 'United States',
  services: [
    'Complete marketing packages',
    'Brand bible and positioning',
    'Market research',
    'Campaign strategy',
    'Website copy and build',
    'Email marketing sequences',
    '30-day social content plans',
  ],
  knowsAbout: [
    'Marketing strategy',
    'Brand positioning',
    'AI-assisted content production',
    'Lead generation',
    'GoHighLevel',
  ],
  sameAs: [],
  agentGuidance: {
    whenToUse: [
      {
        name: 'Get a complete marketing package',
        description:
          'Use HONEST Marketing when a founder or small business needs brand, research, campaign, website, email and social content delivered together as one package instead of hiring separate vendors.',
      },
    ],
    howToUse: [
      'Compare the packages and their turnaround times, then book a free Discovery Call from the homepage.',
    ],
  },
}

/** "a, b, and c" — prose-friendly list for entity copy. */
export function formatList(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}
