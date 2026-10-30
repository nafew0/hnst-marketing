import { notFound } from 'next/navigation'
import { z } from 'zod'

import { PackageInterestForm } from '@/components/forms/lead-form'
import { PackageReveal } from '@/components/sections/signature/package-reveal'
import {
  PageHero,
  ComparisonTable,
  FaqList,
  consentCopy,
} from '@/components/sections/standard/catalog'
import { DraftIndicator } from '@/components/sections/standard/draft-indicator'
import { packageFacts } from '@/components/sections/standard/package-facts'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Section, Container } from '@/components/ui/section'
import {
  getPackages,
  getFaqs,
  getSettings,
  getPage,
  readContext,
} from '@/lib/cms/data'
import { serviceSchema } from '@/lib/seo/cms'
import { JsonLd } from '@/lib/seo/json-ld'

import s from '@/components/sections/standard/package-reveal.module.css'

export async function PackageDetailContent({ tier }: { tier: string }) {
  const [packages, faqs, settings, catalog, context] = await Promise.all([
    getPackages(),
    getFaqs(),
    getSettings(),
    getPage('packages'),
    readContext(),
  ])
  const item = packages.find((p) => p.tier === tier)
  if (!item) notFound()
  const legal = z.object({ slug: z.string() }).safeParse(item.legalDoc)
  return (
    <>
      <DraftIndicator
        visible={
          context?.preview === true &&
          (item._status === 'draft' ||
            settings?._status === 'draft' ||
            faqs.some((faq) => faq._status === 'draft'))
        }
      />
      <JsonLd data={serviceSchema(item)} />
      <PageHero
        title={item.name}
        eyebrow={item.highlight ? 'OUR LEAD OFFER' : 'YOUR NEXT CHAPTER'}
        description={item.turnaround}
      />
      <Section>
        <Container className="grid dr-gap-48 dt:grid-cols-2">
          <div className="flex flex-col dr-gap-32">
            <Heading as="h2" size="h3">
              {item.name}
            </Heading>
            <PackageReveal
              items={[packageFacts(item)]}
              compareToggle={false}
              className={s.detailReveal ?? ''}
            />
            {item.valueLabel && (
              <p className="caption text-silver">{item.valueLabel}</p>
            )}
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
        <Container className="flex flex-col dr-gap-32">
          {catalog?.blocks?.find(
            (block) => block.blockType === 'comparisonTable'
          )?.title && (
            <Heading>
              {
                catalog.blocks.find(
                  (block) => block.blockType === 'comparisonTable'
                )?.title
              }
            </Heading>
          )}
          <ComparisonTable items={packages} />
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
