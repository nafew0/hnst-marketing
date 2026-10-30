import type { Metadata } from 'next'

import { PageShell } from '@/components/sections/standard/catalog'
import { PackageDetailContent } from '@/components/sections/standard/pages/package-detail'
import { getPackages, readContext } from '@/lib/cms/data'
import { routeAlternates } from '@/lib/seo/alternates'

interface Props {
  params: Promise<{ tier: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tier } = await params
  const item = (await getPackages()).find((p) => p.tier === tier)
  const context = await readContext()
  const metadata: Metadata = {
    title: item?.name ?? 'Package not found',
    description: item
      ? `${item.name}: ${item.turnaround}. Explore the deliverables and start a conversation.`
      : 'Package not found.',
    alternates: routeAlternates(`/packages/${tier}`),
    openGraph: { images: ['/og'] },
  }
  if (context?.preview) metadata.robots = { index: false, follow: false }
  return metadata
}
export default async function PackagePage({ params }: Props) {
  const { tier } = await params
  return (
    <PageShell>
      <PackageDetailContent tier={tier} />
    </PageShell>
  )
}
