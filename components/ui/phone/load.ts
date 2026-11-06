import { PHONE_SETTINGS_DRAFT, type PhoneSettings } from './settings'

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
 * What the phone layout reads from the CMS. Until M3 (Astra) adds the `phone`
 * fields, it is the DRAFT copy and no social links (none exist yet). M3
 * replaces the body with a cached, published-only read, so `/` stays static,
 * parsed with `phoneSettingsSchema` and falling back to the draft.
 */
export function loadPhoneContent(): PhoneContent {
  return { settings: PHONE_SETTINGS_DRAFT, socialLinks: [] }
}
