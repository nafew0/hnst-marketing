import { describe, expect, it } from 'bun:test'

import {
  CONTACT_FALLBACK,
  contactHref,
  DOCK,
  GRID,
  isPhoneLinkId,
  isPhoneOnlyApp,
  PHONE_APPS,
  phoneOnlyHref,
  SOCIAL_HOME,
  siteContact,
  socialNetworkOf,
  socialUrl,
} from './registry'
import {
  fillNotification,
  PHONE_SETTINGS_DRAFT,
  phoneSettingsSchema,
} from './settings'

// Invariants the home screen, Astra's CMS fields (M3) and the notifications
// (M2) all rely on.

describe('phone app registry', () => {
  it('lays out 15 grid icons and an iPhone dock, each id once', () => {
    const ids = PHONE_APPS.map((app) => app.id)
    expect(new Set(ids).size).toBe(ids.length)
    const grid = PHONE_APPS.filter((app) => app.place === 'grid')
    expect(grid).toHaveLength(15)
    expect([...GRID].sort()).toEqual(grid.map((app) => app.id).sort())
    expect(DOCK).toEqual(['phone', 'browser', 'messages', 'email'])
    for (const id of DOCK)
      expect(
        isPhoneLinkId(id) ||
          PHONE_APPS.some((app) => app.id === id && app.place === 'dock')
      ).toBe(true)
  })

  // The CMS stores a notification's app as a Postgres enum built from these
  // ids (lib/cms/phone-settings.ts, migration 20261106-142013): a new or
  // renamed id needs a migration, so links stay out of PHONE_APPS.
  it('keeps the ids the CMS enum holds', () => {
    expect(PHONE_APPS.map((app) => app.id)).toEqual([
      'honest',
      'calendar',
      'camera',
      'packages',
      'how-it-works',
      'about',
      'marketer',
      'instagram',
      'x',
      'youtube',
      'tiktok',
      'linkedin',
      'photos',
      'browser',
      'notes',
      'mail',
    ])
  })

  it('never names an app after Apple', () => {
    for (const app of PHONE_APPS) {
      expect(`${app.label} ${app.name}`).not.toMatch(/safari|app store/iu)
    }
  })

  it('knows its phone-only apps and where they live', () => {
    expect(isPhoneOnlyApp('camera')).toBe(true)
    expect(isPhoneOnlyApp('notes')).toBe(true)
    expect(isPhoneOnlyApp('calendar')).toBe(false)
    expect(isPhoneOnlyApp(null)).toBe(false)
    expect(phoneOnlyHref('camera')).toBe('/?app=camera')
  })

  it('reads the network from a social link’s host', () => {
    expect(socialNetworkOf('https://www.instagram.com/honest')).toBe(
      'instagram'
    )
    expect(socialNetworkOf('https://twitter.com/honest')).toBe('x')
    expect(socialNetworkOf('https://youtu.be/abc')).toBe('youtube')
    expect(socialNetworkOf('https://uk.linkedin.com/company/honest')).toBe(
      'linkedin'
    )
    expect(socialNetworkOf('https://notinstagram.com/honest')).toBeUndefined()
    expect(socialNetworkOf('not a url')).toBeUndefined()
  })

  it('links each network to HONEST’s profile, or its home page until then', () => {
    const links = [{ url: 'https://www.instagram.com/honest' }]
    expect(socialUrl('instagram', links)).toBe(
      'https://www.instagram.com/honest'
    )
    expect(socialUrl('youtube', links)).toBe(SOCIAL_HOME.youtube)
    for (const url of Object.values(SOCIAL_HOME))
      expect(url).toMatch(/^https:\/\//u)
  })

  it('opens the visitor’s own Phone, Messages and Mail', () => {
    const contact = siteContact({ email: null, phone: ' +1 (234) 567-89 ' })
    expect(contact.email).toBe(CONTACT_FALLBACK.email)
    expect(contactHref('phone', contact)).toBe('tel:+123456789')
    expect(contactHref('sms', contact)).toBe('sms:+123456789')
    expect(contactHref('email', contact)).toBe(
      `mailto:${CONTACT_FALLBACK.email}`
    )
    expect(siteContact({})).toEqual(CONTACT_FALLBACK)
  })
})

describe('phone settings', () => {
  it('ships draft copy that meets the CMS shape', () => {
    expect(phoneSettingsSchema.safeParse(PHONE_SETTINGS_DRAFT).success).toBe(
      true
    )
    expect(PHONE_SETTINGS_DRAFT.approved).toBe(false)
  })

  it('rejects CMS values that don’t meet the shape', () => {
    expect(phoneSettingsSchema.safeParse({ lockScreen: 'yes' }).success).toBe(
      false
    )
  })

  it('keeps times out of a queued booking', () => {
    const queued = PHONE_SETTINGS_DRAFT.notifications.find(
      (item) => item.trigger === 'booking-queued'
    )
    expect(queued?.body).not.toContain('{time}')
    expect(fillNotification('Call booked: {time}', { time: 'Tue 10:00' })).toBe(
      'Call booked: Tue 10:00'
    )
  })
})
