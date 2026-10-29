import { notFound } from 'next/navigation'

interface CmsPageProps {
  params: Promise<{ slug: string[] }>
}

/**
 * Renders a published Sanity `page` at its single-segment slug (`/about`);
 * deeper paths 404. As the catch-all, `notFound()` here renders the 404 inside
 * the (site) group's chrome and providers instead of the bare root layout.
 *
 * A sanity-less project keeps this file, stripped to a `notFound()` stub by
 * the sanity bundle's `codeTransforms` in `lib/scripts/integration-bundles.ts`.
 */
export default async function CmsPage({ params }: CmsPageProps) {
  void params
  notFound()
}

export async function generateMetadata({ params }: CmsPageProps) {
  void params
  return
}
