import type { PackageFacts } from '@/components/sections/signature/copy'
import type { OfferPackage, OffersResponse } from '@/lib/contracts'

/**
 * Applies live offers over the facts passed in. A tier the API doesn't list
 * keeps its own price, and no response at all (503, the contract's "fall back
 * to CMS package prices") keeps every price.
 */
export function withOffers(
  items: readonly PackageFacts[],
  offers: OffersResponse | null
): readonly PackageFacts[] {
  if (!offers) return items
  const byTier = new Map<string, OfferPackage>(
    offers.packages.map((offer) => [offer.tier, offer])
  )
  return items.map((item) => {
    const offer = byTier.get(item.tier)
    if (!offer) return item
    const merged: PackageFacts = {
      ...item,
      price: offer.price,
      turnaround: offer.turnaround,
    }
    if (offer.value !== undefined) merged.value = offer.value
    return merged
  })
}
