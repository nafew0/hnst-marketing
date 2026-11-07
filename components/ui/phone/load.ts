import { getPublishedPhoneContent } from '@/lib/cms/data'

import {
  type SiteContact,
  type SocialNetwork,
  siteContact,
  socialUrl,
} from './registry'
import type { PhoneSettings } from './settings'

/** A CMS social link, as `socialLinks` in site settings holds it. */
export interface SocialLink {
  label: string
  url: string
}

export interface PhoneContent {
  settings: PhoneSettings
  socialLinks: readonly SocialLink[]
  /** For the Phone, Messages and Mail icons; the fallback until the CMS has them. */
  contact: SiteContact
}

/**
 * What the phone layout reads from the CMS: published site settings only
 * (M3's `getPublishedPhoneContent`), cached and never in draft mode, so `/`
 * stays static. Settings that are missing or fail `phoneSettingsSchema` fall
 * back to the draft copy; with no CMS there are no social links, and the
 * contact details are `CONTACT_FALLBACK`.
 */
export async function loadPhoneContent(): Promise<PhoneContent> {
  const { settings, socialLinks, publicEmail, publicPhone } =
    await getPublishedPhoneContent()
  return {
    settings,
    socialLinks,
    contact: siteContact({ email: publicEmail, phone: publicPhone }),
  }
}

/** Where the docks' way-out icons go: contact details and a URL per network. */
export interface SiteLinks {
  contact: SiteContact
  social: Record<SocialNetwork, string>
}

/** The desktop dock's links, from the same CMS read as the phone's. */
export function siteLinks(content: PhoneContent): SiteLinks {
  const url = (network: SocialNetwork) =>
    socialUrl(network, content.socialLinks)
  return {
    contact: content.contact,
    social: {
      instagram: url('instagram'),
      x: url('x'),
      youtube: url('youtube'),
      tiktok: url('tiktok'),
      linkedin: url('linkedin'),
    },
  }
}
