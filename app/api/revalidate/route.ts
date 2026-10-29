import { type NextRequest, NextResponse } from 'next/server'
// Single webhook endpoint for every integration that revalidates cached
// content. Each provider owns its handler in its integration folder and gets
// one guard + dispatch pair here, so `setup:project` strips a dropped provider
// by removing its import, guard and dispatch, never the handler body. The
// fallback belongs to no provider and always survives. With every provider
// stripped nothing reads `request`, so it becomes `_request` (unused-parameter
// checks).
//
// Not rate limited, here or in `proxy.ts`: a per-IP limit would mostly turn
// away the providers themselves during a bulk publish, leaving the site stale.
// A request with no provider's signal gets the 404 below without its body
// being read. What a provider's request can cost before rejection is noted at
// its guard.
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { data: null, error: 'No webhook handler configured' },
    { status: 404 }
  )
}
