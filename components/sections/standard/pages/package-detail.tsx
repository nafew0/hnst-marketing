import { notFound } from 'next/navigation'
import { z } from 'zod'

import { PackageInterestForm } from '@/components/forms/lead-form'
import {
  PageHero,
  Price,
  FaqList,
  consentCopy,
} from '@/components/sections/standard/catalog'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Section, Container } from '@/components/ui/section'
import { getPackages, getFaqs, getSettings } from '@/lib/cms/data'
import { serviceSchema } from '@/lib/seo/cms'
import { JsonLd } from '@/lib/seo/json-ld'

export async function PackageDetailContent({ tier }: { tier: string }) {
  const [packages, faqs, settings] = await Promise.all([
    getPackages(),
    getFaqs(),
    getSettings(),
  ])
  const item = packages.find((p) => p.tier === tier)
  if (!item) notFound()
  const legal = z.object({ slug: z.string() }).safeParse(item.legalDoc)
  return (
    <>
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
    </>
  )
}
