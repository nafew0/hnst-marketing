import { describe, expect, it } from 'bun:test'

import {
  isPhoneOnlyApp,
  PHONE_APPS,
  phoneOnlyHref,
  socialNetworkOf,
} from './registry'
import {
  fillNotification,
  PHONE_SETTINGS_DRAFT,
  phoneSettingsSchema,
} from './settings'

// Invariants the home screen, Astra's CMS fields (M3) and the notifications
// (M2) all rely on.

describe('phone app registry', () => {
  it('lays out 12 grid icons and a 4-icon dock, each id once', () => {
    const ids = PHONE_APPS.map((app) => app.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(PHONE_APPS.filter((app) => app.place === 'grid')).toHaveLength(12)
    expect(PHONE_APPS.filter((app) => app.place === 'dock')).toHaveLength(4)
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
