import { PackageDetailApp } from '@/components/apps/packages'
import { PackageDetailContent } from '@/components/sections/standard/pages/package-detail'
import { PhoneView } from '@/components/ui/phone/view'
import { WindowRoute } from '@/components/ui/window/route'
import { getPackages } from '@/lib/cms/data'

export { generateMetadata } from '@/app/(site)/packages/[tier]/page'

export default async function PackageWindow({
  params,
}: {
  params: Promise<{ tier: string }>
}) {
  const { tier } = await params
  const item = (await getPackages()).find((p) => p.tier === tier)
  return (
    <WindowRoute href={`/packages/${tier}`} title={item?.name ?? 'Package'}>
      <PhoneView phone={<PackageDetailApp tier={tier} />}>
        <PackageDetailContent tier={tier} />
      </PhoneView>
    </WindowRoute>
  )
}
