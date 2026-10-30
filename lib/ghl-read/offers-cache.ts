import { unstable_cache } from 'next/cache'

import {
  OFFERS_CACHE_TAG,
  OFFERS_REVALIDATE_SECONDS,
} from '@/lib/ghl/constants'
import { ghlFromEnv } from '@/lib/ghl/from-env'

import { loadOffers } from './offers'

/**
 * The GoHighLevel SDK calls axios, not `fetch`, so a per-fetch `next` cache
 * option cannot be set. `unstable_cache` is the supported tag while
 * `cacheComponents` is off. The offer-changed webhook expires `offers`.
 */
export const readCachedOffers = unstable_cache(
  async () => loadOffers(ghlFromEnv()),
  ['ghl-offers'],
  {
    revalidate: OFFERS_REVALIDATE_SECONDS,
    tags: [OFFERS_CACHE_TAG],
  }
)
