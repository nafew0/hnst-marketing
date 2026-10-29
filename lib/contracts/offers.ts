import { z } from 'zod'

import { tierSchema } from './common'

/**
 * GET /api/v1/offers
 *
 * Live package prices and offer details read from GHL custom values and
 * products (one source of truth shared with GHL funnels and emails). Cached
 * server-side with tag `offers`; the "offer-changed" workflow webhook
 * revalidates it.
 *
 * 200 → { packages: [...], phone?, banner? }
 * 503 → upstream_unavailable (front end falls back to CMS package prices)
 */
export const offerPackageSchema = z.object({
  tier: tierSchema,
  /** Current price in whole US dollars. */
  price: z.number().int().nonnegative(),
  /** Stated value in whole US dollars (shown struck through), when set. */
  value: z.number().int().nonnegative().optional(),
  /** Human-readable turnaround, e.g. "7–14 days". */
  turnaround: z.string().max(80),
})
export type OfferPackage = z.infer<typeof offerPackageSchema>

export const offersResponseSchema = z.object({
  packages: z.array(offerPackageSchema),
  phone: z.string().max(40).optional(),
  banner: z.string().max(200).optional(),
})
export type OffersResponse = z.infer<typeof offersResponseSchema>
