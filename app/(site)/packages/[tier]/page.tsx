import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { z } from 'zod'

import { PackageInterestForm } from '@/components/forms/lead-form'
import {
  PageShell,
  PageHero,
  Price,
  FaqList,
  consentCopy,
} from '@/components/sections/standard/catalog'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Section, Container } from '@/components/ui/section'
import { getPackages, getFaqs, getSettings } from '@/lib/cms/data'
import { routeAlternates } from '@/lib/seo/alternates'
import { serviceSchema } from '@/lib/seo/cms'
import { JsonLd } from '@/lib/seo/json-ld'
interface Props {
  params: Promise<{ tier: string }>
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tier } = await params
  const item = (await getPackages()).find((p) => p.tier === tier)
  return {
    title: item?.name ?? 'Package not found',
    description: item
      ? `${item.name}: ${item.turnaround}. Explore the deliverables and start a conversation.`
      : 'Package not found.',
    alternates: routeAlternates(`/packages/${tier}`),
    openGraph: { images: ['/og'] },
  }
}
export default async function PackagePage({ params }: Props) {
  const { tier } = await params
  const [packages, faqs, settings] = await Promise.all([
    getPackages(),
    getFaqs(),
    getSettings(),
  ])
  const item = packages.find((p) => p.tier === tier)
  if (!item) notFound()
  const legal = z.object({ slug: z.string() }).safeParse(item.legalDoc)
  return (
    <PageShell>
      <JsonLd data={serviceSchema(item)} />
      <PageHero
        title={item.name}
        eyebrow={item.highlight ? 'OUR LEAD OFFER' : 'YOUR NEXT CHAPTER'}
        description={item.turnaround}
      />
      <Section>
        <Container className="grid dr-gap-48 dt:grid-cols-2">
          <div className="flex flex-col dr-gap-32">
            <Price item={item} />
            {item.deliverables?.map((d) => (
              <div key={d.id ?? d.title}>
                <Heading as="h2" size="h3">
                  {d.title}
                </Heading>
                <p className="dr-mt-12 p text-silver">{d.description}</p>
              </div>
            ))}
            <p className="p text-silver">{settings?.toolCostDisclosure}</p>
            <>
              {legal.success && (
                <Button variant="link" href={`/legal/${legal.data.slug}`}>
                  Package terms
                </Button>
              )}
            </>
            <Button variant="link" href="/packages">
              Compare all packages
            </Button>
          </div>
          <div className="rounded-[16px] border border-gold/30 bg-void-2 dr-p-32">
            <Heading as="h2" size="h3" className="dr-mb-24">
              Let’s explore the fit.
            </Heading>
            <PackageInterestForm
              tier={item.tier}
              consent={consentCopy(settings)}
            />
          </div>
        </Container>
      </Section>
      <Section>
        <Container>
          <FaqList
            items={faqs.filter(
              (f) => f.category === 'pricing' || f.category === 'timeline'
            )}
          />
        </Container>
      </Section>
    </PageShell>
  )
}
