import { z } from 'zod'

import { PHONE_APPS, type PhoneAppId } from './registry'

/**
 * The phone layout's fields in Payload's site settings, as the front end reads
 * them. Claude owns this shape. Astra builds the matching `phone` group in
 * `lib/cms` (M3) and maps its document onto it. The loader parses it with
 * `phoneSettingsSchema` at that boundary and uses PHONE_SETTINGS_DRAFT when
 * it doesn't parse, as it can't until M3 lands. None of it is approved (decision 6, 6 Nov 2026).
 */

export const NOTIFICATION_TRIGGERS = [
  /** On the lock screen, the first visit of a session. */
  'lock-first-visit',
  /** About 10 s on the home screen. */
  'home-idle',
  /** Left Packages without booking. */
  'left-packages',
  /** Took a photo with Camera. */
  'photo-taken',
  /** A booking came back `202`: queued, no time yet. Never show a time. */
  'booking-queued',
  /** A booking came back `201`: `{time}` is the real booked time. */
  'booking-confirmed',
  /** A wall photo was sent and waits for approval. */
  'wall-sent',
  /** The eBook and its delivery email exist. Off until then. */
  'ebook-ready',
] as const
export type NotificationTrigger = (typeof NOTIFICATION_TRIGGERS)[number]

export const NOTIFICATION_TITLE_MAX = 60
export const NOTIFICATION_BODY_MAX = 140

// SAFETY: PHONE_APPS is a non-empty literal list, and every id in it is a
// PhoneAppId (registry.test.ts checks the list).
const appIds = PHONE_APPS.map((app) => app.id) as [PhoneAppId, ...PhoneAppId[]]

export const phoneNotificationSchema = z.object({
  trigger: z.enum(NOTIFICATION_TRIGGERS),
  /** The app it opens. */
  app: z.enum(appIds),
  title: z.string().trim().min(1).max(NOTIFICATION_TITLE_MAX),
  /** May hold `{time}` (booking-confirmed only). */
  body: z.string().trim().min(1).max(NOTIFICATION_BODY_MAX),
  enabled: z.boolean(),
})
export type PhoneNotification = z.infer<typeof phoneNotificationSchema>

const text = (max: number) => z.string().trim().min(1).max(max)

export const phoneSettingsSchema = z.object({
  /** Off: visits start on the home screen. */
  lockScreen: z.boolean(),
  notifications: z.array(phoneNotificationSchema).max(20),
  widgets: z.object({
    nextCallTitle: text(40),
    /** Shown when the slots API has no time in the next 31 days, or fails. */
    nextCallEmpty: text(80),
    installTitle: text(40),
    installBody: text(140),
  }),
  camera: z.object({
    /** Drawn into every photo's gold frame. */
    frameText: text(40),
  }),
  wall: z.object({
    /** Shown beside the unticked box and sent with the photo, word for word. */
    consentText: text(600),
    /** The "Wall rules" legal document. */
    rulesHref: z.string().startsWith('/').max(200),
  }),
  /** False until the Founder approves the copy: the UI marks it DRAFT. */
  approved: z.boolean(),
})
export type PhoneSettings = z.infer<typeof phoneSettingsSchema>

/** Placeholder copy, marked DRAFT wherever it shows. Not approved. */
export const PHONE_SETTINGS_DRAFT: PhoneSettings = {
  lockScreen: true,
  notifications: [
    {
      trigger: 'lock-first-visit',
      app: 'calendar',
      title: 'Discovery call',
      body: '30 minutes. Pick a time.',
      enabled: true,
    },
    {
      trigger: 'lock-first-visit',
      app: 'packages',
      title: 'Packages',
      body: 'See what’s in the Founder Package.',
      enabled: true,
    },
    {
      trigger: 'home-idle',
      app: 'notes',
      title: 'Notes',
      body: 'Leave HONEST a note.',
      enabled: true,
    },
    {
      trigger: 'left-packages',
      app: 'calendar',
      title: 'Questions about a package?',
      body: 'Pick a time to talk.',
      enabled: true,
    },
    {
      trigger: 'photo-taken',
      app: 'camera',
      title: 'Nice shot',
      body: 'Post it to the HONEST wall?',
      enabled: true,
    },
    {
      trigger: 'booking-queued',
      app: 'calendar',
      title: 'Request received',
      body: 'Your confirmation follows by email.',
      enabled: true,
    },
    {
      trigger: 'booking-confirmed',
      app: 'calendar',
      title: 'Call booked',
      body: '{time}',
      enabled: true,
    },
    {
      trigger: 'wall-sent',
      app: 'photos',
      title: 'Photo sent',
      body: 'It’s waiting for approval.',
      enabled: true,
    },
    {
      trigger: 'ebook-ready',
      app: 'marketer',
      title: 'The HONEST Marketer',
      body: 'Read the book.',
      enabled: false,
    },
  ],
  widgets: {
    nextCallTitle: 'Next free call',
    nextCallEmpty: 'See the calendar for times.',
    installTitle: 'Add to Home Screen',
    installBody: 'Keep HONEST on your phone, one tap away.',
  },
  camera: { frameText: 'HONEST' },
  wall: {
    consentText:
      'Show my photo on the HONEST wall. I can ask for it to be removed at any time.',
    rulesHref: '/legal/wall-rules',
  },
  approved: false,
}

/** A booking-confirmed body with its real time filled in. */
export function fillNotification(body: string, values: { time?: string }) {
  return body.replaceAll('{time}', values.time ?? '')
}
