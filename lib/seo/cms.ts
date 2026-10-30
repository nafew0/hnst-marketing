import type { Metadata } from 'next'
import { z } from 'zod'

import { getPage } from '@/lib/cms/data'
import type { Faq, Package } from '@/lib/cms/payload-types'
import { routeAlternates } from '@/lib/seo/alternates'
import { SITE } from '@/lib/seo/site'
export async function pageMetadata(
  slug: string,
  fallback: string
): Promise<Metadata> {
  const page = await getPage(slug)
  const title = page?.seo?.title ?? page?.title ?? fallback
  const description = page?.seo?.description ?? SITE.description
  const image = z
    .object({ url: z.string().min(1) })
    .safeParse(page?.seo?.ogImage)
  const imageUrl = image.success ? image.data.url : undefined
  const metadata: Metadata = {
    title,
    description,
    alternates: routeAlternates(`/${slug}`),
    openGraph: { title, description, images: [imageUrl ?? '/og'] },
  }
  if (!page || page._status === 'draft')
    metadata.robots = { index: false, follow: false }
  return metadata
}
export interface ServiceSchema {
  '@context': 'https://schema.org'
  '@type': 'Service'
  name: string
  provider: { '@id': string }
  offers: {
    '@type': 'Offer'
    price: number
    priceCurrency: string
    url: string
  }
}
export interface FaqSchema {
  '@context': 'https://schema.org'
  '@type': 'FAQPage'
  mainEntity: {
    '@type': 'Question'
    name: string
    acceptedAnswer: { '@type': 'Answer'; text: string }
  }[]
}
export function serviceSchema(item: Package): ServiceSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: item.name,
    provider: { '@id': `${SITE.url}/#organization` },
    offers: {
      '@type': 'Offer',
      price: item.price,
      priceCurrency: 'USD',
      url: `${SITE.url}/packages/${item.tier}`,
    },
  }
}
export function faqSchema(items: Faq[]): FaqSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}
