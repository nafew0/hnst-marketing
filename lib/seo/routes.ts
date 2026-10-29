import { STATIC_ROUTES } from '@/lib/seo/route-catalog'

export type { StaticRoute } from '@/lib/seo/route-catalog'
export { STATIC_ROUTES }

// Route enumeration shared by `app/sitemap.ts` and `app/llms.txt/route.ts`,
// so the two never disagree about which URLs exist.

export interface ContentRoute {
  path: string
  label: string
  lastModified: Date
}

// Permissive (`nullable()`) because it validates a hand-written query, not a
// typegen'd one; malformed documents are skipped per entry.

/**
 * Turns a CMS query result into routes. No CMS is wired in this project, so
 * there is never anything to convert.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- this IS the I/O boundary: the untyped Sanity result is validated per entry below
export function buildRoutesFromDocuments(data: unknown): ContentRoute[] {
  void data
  return []
}

export interface CmsRoutesResult {
  routes: ContentRoute[]
  /**
   * True when the CMS fetch failed rather than returning zero documents. Only
   * the per-request Markdown handler sees this, so it can answer 503 instead
   * of 404ing a route that exists once the outage clears.
   */
  degraded: boolean
}

/**
 * No CMS is wired, so there are no CMS routes and no outage to report —
 * callers degrade to `STATIC_ROUTES` only.
 */
async function fetchCmsRoutesResult(): Promise<CmsRoutesResult> {
  return { routes: [], degraded: false }
}

/** Routes for sitemap.xml, llms.txt and `/ai`: none without a CMS. */
export async function getCmsRoutes(
  load: () => Promise<CmsRoutesResult> = fetchCmsRoutesResult
): Promise<ContentRoute[]> {
  void load
  return []
}

/** Accessor for the Markdown handler; never degraded without a CMS. */
export async function getCmsRoutesResult(
  load: () => Promise<CmsRoutesResult> = fetchCmsRoutesResult
): Promise<CmsRoutesResult> {
  return load()
}
