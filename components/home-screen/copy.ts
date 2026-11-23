import { z } from 'zod'

import { WORLD_CLIPS, type WorldClip } from '@/components/world/worlds'
import type { HomeScreen } from '@/lib/cms/payload-types'

/*
 * The home screen for the high-end offers (Nov 2026): Dylan's "link in bio"
 * layout over the existing site. Every word is the CMS's (lib/cms/home-screen.ts);
 * these are the words until it has its own, and what an empty field shows.
 */

/** Where a button goes: a page, or the cinematic homepage under the screen. */
export const HOMEPAGE_HREF = '#homepage'

export interface HomeScreenLink {
  label: string
  href: string
  note?: string | undefined
}

/** How a widget looks: headlines cycling through it, or a social profile card. */
export const WIDGET_STYLES = ['headlines', 'profile'] as const
export type WidgetStyle = (typeof WIDGET_STYLES)[number]

/**
 * One of Dylan's four widgets (20 Nov 2026): "4 by 1", one tap opens its page,
 * and its page's headlines scroll through it, like an animated GIF.
 */
export interface HomeScreenWidget extends HomeScreenLink {
  style: WidgetStyle
  /** The headlines that cycle through a `headlines` widget. */
  lines: readonly string[]
  /** A `profile` widget's handle, e.g. @hnstmarketing. */
  handle?: string | undefined
}

export interface HomeScreenOffer {
  title: string
  line: string
  href: string
  badge?: string | undefined
}

export interface HomeScreenCopy {
  enabled: boolean
  background: WorldClip
  /** Read by screen readers and search engines; the widgets fill the screen. */
  title: string
  buttons: readonly HomeScreenWidget[]
  /** The square app icons above the dock: home page, about, offers. */
  links: readonly HomeScreenLink[]
  backLabel: string
  /** Over the widgets for a prospect who came by their tagged link. */
  greeting: string
  /**
   * The first screen of a visit (20 Nov 2026): a priority notification that
   * asks whether they came with an audit. Locked until they pick one.
   */
  lock: {
    enabled: boolean
    app: string
    tag: string
    title: string
    body: string
    audit: string
    browse: string
    locked: string
    hint: string
  }
  bar: {
    call: string
    text: string
    email: string
    price: string
    /** `{page}` becomes the page the visitor is on. */
    textMessage: string
    emailSubject: string
    emailBody: string
    priceMessage: string
    priceSubject: string
  }
  offers: {
    eyebrow: string
    heading: string
    body: string
    terms: string
    priceLabel: string
    exploreLabel: string
    items: readonly HomeScreenOffer[]
  }
}

export const HOME_SCREEN_DEFAULTS: HomeScreenCopy = {
  enabled: false,
  background: 'lunar-horizon',
  title: 'HONEST Marketing',
  buttons: [
    {
      label: 'Your own mobile application',
      href: '/mobile-application',
      note: 'Our lead offer',
      style: 'headlines',
      lines: [
        'Own the platform, not another rented CRM.',
        'Your brand on your customer’s home screen.',
        'Your data, in your house.',
        'Do you own your platform? You should.',
      ],
    },
    {
      label: 'Start a podcast',
      href: '/podcast',
      style: 'headlines',
      lines: [
        'Control the public narrative with your own voice.',
        'You only show up. We handle everything around the mic.',
        'New business, culture and recruiting, from one chair.',
      ],
    },
    {
      label: 'Get content',
      href: '/content-gallery',
      style: 'headlines',
      lines: [
        'Big launches die on small content.',
        'Documentary, series, reels, event, community.',
        'Build enough hype before the day arrives.',
      ],
    },
    {
      label: 'Social media',
      href: '/social',
      style: 'profile',
      lines: [],
      handle: '@hnstmarketing',
    },
  ],
  links: [
    { label: 'Home page', href: HOMEPAGE_HREF },
    { label: 'About', href: '/about' },
    { label: 'Offers', href: '/offers' },
  ],
  backLabel: 'Home screen',
  greeting: '{name}, I knew you’d show up.',
  lock: {
    enabled: true,
    app: 'HONEST Marketing',
    tag: 'Priority',
    title: 'Did you get an audit from us?',
    body: 'Pick one, so the site shows you the right things.',
    audit: 'Yes, I got an audit',
    browse: 'I’m here for the website',
    locked: 'You didn’t pick an experience. Choose one above.',
    hint: 'Swipe up for the full site',
  },
  bar: {
    call: 'Call',
    text: 'Text',
    email: 'Email',
    price: 'Get a Price',
    textMessage:
      'Hi Dylan, I’m on the {page} page of hnst.marketing. Can we talk?',
    emailSubject: '{page}: hnst.marketing',
    emailBody:
      'Hi Dylan,\n\nI’m on the {page} page of hnst.marketing and I’d like to talk.\n\n',
    priceMessage:
      'Hi Dylan, I’d like a price for {page}. Here’s what we’re trying to do: ',
    priceSubject: 'A price for {page}',
  },
  offers: {
    eyebrow: 'Offers',
    heading: 'Custom scope, not a menu of discounts.',
    body: 'Three offers for companies already doing $10M+ a year. The scope is set by your ambition, not a package. There’s no price list here, because there’s no package. Use Get a Price and tell us what you’re trying to do. We’ll talk price after we hear the intent, not before.',
    terms:
      'Results depend on your market, your offer and your commitment. We don’t guarantee revenue, rankings or downloads.',
    priceLabel: 'Get a Price',
    exploreLabel: 'Explore',
    items: [
      {
        title: 'Mobile Application',
        line: 'Own the platform in your customer’s pocket.',
        href: '/mobile-application',
        badge: 'Our lead offer',
      },
      {
        title: 'Podcast',
        line: 'Leader-led marketing, produced as a full solution.',
        href: '/podcast',
      },
      {
        title: 'Launch Content Gallery',
        line: 'The content engine for a launch.',
        href: '/content-gallery',
      },
    ],
  },
}

const text = (fallback: string) =>
  z
    .string()
    .nullish()
    .transform((value) => value?.trim() || fallback)

const optional = z
  .string()
  .nullish()
  .transform((value) => value?.trim() || undefined)

const link = z.object({
  label: z.string().trim().min(1),
  href: z.string().trim().min(1),
  note: optional,
})

const widget = link.extend({
  style: z
    .enum(WIDGET_STYLES)
    .nullish()
    .transform((value) => value ?? 'headlines'),
  lines: z
    .array(z.object({ text: z.string().nullish() }))
    .nullish()
    .transform((rows) => (rows ?? []).flatMap((row) => row.text?.trim() || [])),
  handle: optional,
})

/** Rows that fail (no label, no address) are dropped, never the whole screen. */
function list<T>(item: z.ZodType<T>, fallback: readonly T[]) {
  return z
    .array(z.unknown())
    .nullish()
    .transform((rows) => {
      const kept = (rows ?? []).flatMap((row) => {
        const parsed = item.safeParse(row)
        return parsed.success ? [parsed.data] : []
      })
      return kept.length ? kept : fallback
    })
}

const D = HOME_SCREEN_DEFAULTS

const schema = z.object({
  enabled: z.boolean().nullish().transform(Boolean),
  background: z
    .string()
    .nullish()
    .transform(
      (value): WorldClip =>
        WORLD_CLIPS.find((clip) => clip.value === value)?.value ?? D.background
    ),
  title: text(D.title),
  buttons: list(widget, D.buttons),
  links: list(link, D.links),
  backLabel: text(D.backLabel),
  greeting: text(D.greeting),
  lock: z
    .object({
      enabled: z
        .boolean()
        .nullish()
        .transform((value) => value !== false),
      app: text(D.lock.app),
      tag: text(D.lock.tag),
      title: text(D.lock.title),
      body: text(D.lock.body),
      audit: text(D.lock.audit),
      browse: text(D.lock.browse),
      locked: text(D.lock.locked),
      hint: text(D.lock.hint),
    })
    .nullish()
    .transform((value) => value ?? D.lock),
  bar: z
    .object({
      call: text(D.bar.call),
      text: text(D.bar.text),
      email: text(D.bar.email),
      price: text(D.bar.price),
      textMessage: text(D.bar.textMessage),
      emailSubject: text(D.bar.emailSubject),
      emailBody: text(D.bar.emailBody),
      priceMessage: text(D.bar.priceMessage),
      priceSubject: text(D.bar.priceSubject),
    })
    .nullish()
    .transform((value) => value ?? D.bar),
  offers: z
    .object({
      eyebrow: text(D.offers.eyebrow),
      heading: text(D.offers.heading),
      body: text(D.offers.body),
      terms: text(D.offers.terms),
      priceLabel: text(D.offers.priceLabel),
      exploreLabel: text(D.offers.exploreLabel),
      items: list(
        z.object({
          title: z.string().trim().min(1),
          line: z.string().trim().min(1),
          href: z.string().trim().min(1),
          badge: optional,
        }),
        D.offers.items
      ),
    })
    .nullish()
    .transform((value) => value ?? D.offers),
})

/** The CMS global, or any part of it: what an editor has saved so far. */
export type HomeScreenRecord = Partial<Omit<HomeScreen, 'id'>>

/** The CMS global as the site reads it; anything missing shows the defaults. */
export function homeScreenFrom(cms: HomeScreenRecord | null): HomeScreenCopy {
  const parsed = schema.safeParse(cms ?? {})
  return parsed.success ? parsed.data : D
}
