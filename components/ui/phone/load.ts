import { getPublishedPhoneContent } from '@/lib/cms/data'

import type { PhoneSettings } from './settings'

/** A CMS social link, as `socialLinks` in site settings holds it. */
export interface SocialLink {
  label: string
  url: string
}

export interface PhoneContent {
  settings: PhoneSettings
  socialLinks: readonly SocialLink[]
}

/**
 * What the phone layout reads from the CMS: published site settings only
 * (M3's `getPublishedPhoneContent`), cached and never in draft mode, so `/`
 * stays static. Settings that are missing or fail `phoneSettingsSchema` fall
 * back to the draft copy; with no CMS there are no social links.
 */
export function loadPhoneContent(): Promise<PhoneContent> {
  return getPublishedPhoneContent()
}
