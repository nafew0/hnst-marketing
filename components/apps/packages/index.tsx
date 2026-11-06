import { z } from 'zod'

import { consentCopy } from '@/components/sections/standard/catalog'
import { packageFacts } from '@/components/sections/standard/package-facts'
import { getPackages, getSettings } from '@/lib/cms/data'
import type { Package } from '@/lib/cms/payload-types'

import { PackagePage, PackageStore, type StoreItem } from './store'

const legalSchema = z.object({ slug: z.string() })

function toStoreItem(item: Package): StoreItem {
  const legal = legalSchema.safeParse(item.legalDoc)
  return {
    facts: packageFacts(item),
    deliverables: (item.deliverables ?? []).map((deliverable) => ({
      title: deliverable.title,
      description: deliverable.description,
    })),
    revisions: item.revisions ?? null,
    valueLabel: item.valueLabel ?? null,
    legalSlug: legal.success ? legal.data.slug : null,
  }
}

/**
 * Packages on the phone, App Store style (docs/phases/M5.md). The same CMS
 * packages as `/packages`, with the same live offers laid over them, so the
 * prices match. No ratings or reviews: there are none to show.
 */
export async function PackagesApp() {
  const [packages, settings] = await Promise.all([getPackages(), getSettings()])
  return (
    <PackageStore
      items={packages.map(toStoreItem)}
      toolCosts={settings?.toolCostDisclosure ?? null}
      consent={consentCopy(settings)}
    />
  )
}

/** One package's page in the store. An unknown tier renders nothing: the page 404s. */
export async function PackageDetailApp({ tier }: { tier: string }) {
  const [packages, settings] = await Promise.all([getPackages(), getSettings()])
  const item = packages.find((candidate) => candidate.tier === tier)
  if (!item) return null
  return (
    <PackagePage
      item={toStoreItem(item)}
      toolCosts={settings?.toolCostDisclosure ?? null}
      consent={consentCopy(settings)}
    />
  )
}
