import {
  SOCIAL_NETWORKS,
  type SocialNetwork,
  socialNetworkOf,
} from '@/components/ui/phone/registry'

export const NETWORK_LABELS = {
  instagram: 'Instagram',
  x: 'X',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
} as const satisfies Record<SocialNetwork, string>

export interface Profile {
  network: SocialNetwork
  label: string
  url: string
}

/**
 * HONEST's own profiles, from Site settings → Social profiles. Only networks
 * with a real profile: an empty one is hidden, never sent to the network's
 * home page.
 */
export function ownProfiles(links: readonly { url: string }[]): Profile[] {
  return SOCIAL_NETWORKS.flatMap((network) => {
    const link = links.find((item) => socialNetworkOf(item.url) === network)
    return link
      ? [{ network, label: NETWORK_LABELS[network], url: link.url }]
      : []
  })
}
