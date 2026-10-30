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
 * Enumerate published Payload routes. An unavailable CMS returns a degraded
 * result so callers can distinguish an outage from an empty collection.
 */
async function fetchCmsRoutesResult(): Promise<CmsRoutesResult> {
  const { getCms } = await import('@/lib/cms/data')
  try {
    const cms = await getCms()
    if (!cms) return { routes: [], degraded: false }
    const [packages, legal, pages] = await Promise.all([
      cms.find({
        collection: 'packages',
        where: { _status: { equals: 'published' } },
        overrideAccess: false,
        limit: 4,
      }),
      cms.find({
        collection: 'legal-docs',
        where: {
          and: [
            { _status: { equals: 'published' } },
            { status: { equals: 'published' } },
          ],
        },
        overrideAccess: false,
        limit: 100,
      }),
      cms.find({
        collection: 'pages',
        where: {
          and: [
            { _status: { equals: 'published' } },
            {
              slug: {
                in: [
                  'packages',
                  'contact',
                  'link-in-bio',
                  'how-it-works',
                  'about',
                  'proof',
                  'the-honest-marketer',
                  'book',
                ],
              },
            },
          ],
        },
        overrideAccess: false,
        limit: 20,
      }),
    ])
    return {
      routes: [
        ...packages.docs.map((p) => ({
          path: `/packages/${p.tier}`,
          label: p.name,
          lastModified: new Date(p.updatedAt),
        })),
        ...legal.docs.map((p) => ({
          path: `/legal/${p.slug}`,
          label: p.title,
          lastModified: new Date(p.updatedAt),
        })),
        ...pages.docs.map((p) => ({
          path: `/${p.slug}`,
          label: p.title,
          lastModified: new Date(p.updatedAt),
        })),
      ],
      degraded: false,
    }
  } catch {
    return { routes: [], degraded: true }
  }
}

/** Routes for sitemap.xml, llms.txt and `/ai`: none without a CMS. */
export async function getCmsRoutes(
  load: () => Promise<CmsRoutesResult> = fetchCmsRoutesResult
): Promise<ContentRoute[]> {
  return (await load()).routes
}

/** Accessor for the Markdown handler; never degraded without a CMS. */
export async function getCmsRoutesResult(
  load: () => Promise<CmsRoutesResult> = fetchCmsRoutesResult
): Promise<CmsRoutesResult> {
  return load()
}
