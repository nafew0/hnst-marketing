import type { PackageRevealItem } from '@/components/sections/signature/package-reveal'
import type { Package } from '@/lib/cms/payload-types'

export function packageFacts(item: Package): PackageRevealItem {
  return {
    tier: item.tier,
    name: item.name,
    summary:
      item.deliverables
        ?.map((deliverable) => deliverable.description)
        .join(' ') ?? '',
    price: item.price,
    priceFrom: item.tier === 'diamond',
    turnaround: item.turnaround,
    href: `/packages/${item.tier}`,
    ctaLabel: item.ctaLabel,
    highlight: item.highlight === true,
    compare: [],
  }
}
