import { ScrollArea } from '@base-ui/react/scroll-area'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { ReactNode } from 'react'

import type { ConsentCopy } from '@/components/forms/lead-form'
import { Wrapper } from '@/components/layout/wrapper'
import { PackageReveal } from '@/components/sections/signature/package-reveal'
import { packageFacts } from '@/components/sections/standard/package-facts'
import { Wave3Block } from '@/components/sections/standard/wave3-blocks'
import { Button } from '@/components/ui/button'
import { Heading, Eyebrow } from '@/components/ui/heading'
import { Container, Section } from '@/components/ui/section'
import type { Faq, Package, Page } from '@/lib/cms/payload-types'
import type { SiteSetting } from '@/lib/cms/payload-types'
import { faqSchema } from '@/lib/seo/cms'
import { JsonLd } from '@/lib/seo/json-ld'

import s from '@/components/sections/standard/package-reveal.module.css'
export function consentCopy(settings: SiteSetting | null): ConsentCopy {
  return {
    email: settings?.consentTexts?.email ?? '',
    sms: settings?.consentTexts?.sms ?? '',
    approved: settings?.consentTexts?.approved === true,
  }
}
export function PageShell({ children }: { children: ReactNode }) {
  return <Wrapper lenis={false}>{children}</Wrapper>
}
export function PageHero({
  title,
  description,
  eyebrow = 'HONEST MARKETING',
}: {
  title: string
  description?: string | null | undefined
  eyebrow?: string | null | undefined
}) {
  return (
    <Section spacing="lg" className="border-b border-gold/20">
      <Container className="flex max-w-[1100px] flex-col dr-gap-24">
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading as="h1" size="display">
          {title}
        </Heading>
        {description && (
          <p className="max-w-[660px] p-big text-silver">{description}</p>
        )}
      </Container>
    </Section>
  )
}
export function Price({ item }: { item: Package }) {
  return (
    <div>
      <p className="h2 text-gold">
        {item.tier === 'diamond' && (
          <span className="p text-silver">From </span>
        )}
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(item.price)}
        {item.tier === 'diamond' && '+'}
      </p>
      {item.valueLabel && (
        <p className="caption text-silver">{item.valueLabel}</p>
      )}
    </div>
  )
}
export function PackageGrid({ items }: { items: Package[] }) {
  return (
    <PackageReveal
      items={items.map(packageFacts)}
      compareToggle={false}
      className={s.reveal ?? ''}
    />
  )
}
export function ComparisonTable({ items }: { items: Package[] }) {
  return (
    <ScrollArea.Root className="min-w-0 overflow-hidden rounded-[16px] border border-gold/20">
      <ScrollArea.Viewport
        role="region"
        aria-label="Package comparison"
        className="w-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
      >
        <table className="w-full min-w-[700px] text-left p">
          <caption className="sr-only">
            HONEST Marketing package comparison
          </caption>
          <thead>
            <tr>
              <th scope="col" className="dr-p-24">
                Included
              </th>
              {items.map((item) => (
                <th key={item.id} scope="col" className="dr-p-24 text-gold">
                  {item.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              {
                label: 'Delivery',
                values: items.map((item) => item.turnaround),
              },
              {
                label: 'Specialist bots',
                values: items.map(
                  (item) => item.bots ?? 'Scope agreed together'
                ),
              },
              {
                label: 'Revisions',
                values: items.map(
                  (item) => item.revisions ?? 'Scope agreed together'
                ),
              },
            ].map((row) => (
              <tr key={row.label} className="border-t border-gold/20">
                <th scope="row" className="dr-p-24">
                  {row.label}
                </th>
                {row.values.map((value, index) => (
                  <td key={items[index]?.id} className="dr-p-24 text-silver">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea.Viewport>
    </ScrollArea.Root>
  )
}
export function FaqList({ items }: { items: Faq[] }) {
  if (!items.length) return null
  return (
    <>
      <JsonLd data={faqSchema(items)} />
      <div>
        {items.map((item) => (
          <details key={item.id} className="border-b border-gold/20 dr-py-24">
            <summary className="cursor-pointer p-big">{item.question}</summary>
            <p className="dr-pt-16 p text-silver">{item.answer}</p>
          </details>
        ))}
      </div>
    </>
  )
}
export function ContentBlocks({
  page,
  packages,
  faqs,
  settings = null,
}: {
  page: Page
  packages: Package[]
  faqs: Faq[]
  settings?: SiteSetting | null
}) {
  return (
    <>
      {page.blocks?.map((block) => {
        if (block.blockType === 'hero')
          return (
            <PageHero
              key={block.id}
              title={block.title}
              description={block.description}
              eyebrow={block.eyebrow}
            />
          )
        return (
          <Section key={block.id}>
            <Container className="flex flex-col dr-gap-32">
              <Heading>{block.title}</Heading>
              {block.blockType === 'packageGrid' && (
                <PackageGrid items={packages} />
              )}
              {block.blockType === 'comparisonTable' && (
                <ComparisonTable items={packages} />
              )}
              {block.blockType === 'faqList' && (
                <FaqList
                  items={faqs.filter(
                    (item) =>
                      !block.category || item.category === block.category
                  )}
                />
              )}
              {block.blockType === 'richText' && <RichText data={block.body} />}
              <Wave3Block block={block} settings={settings} />
              {block.blockType === 'cta' && (
                <>
                  <p className="p text-silver">{block.description}</p>
                  <Button href={block.href}>{block.label}</Button>
                </>
              )}
            </Container>
          </Section>
        )
      })}
    </>
  )
}
export function CmsUnavailable() {
  return (
    <Section>
      <Container>
        <p className="p">We’re preparing this page. Please check back soon.</p>
      </Container>
    </Section>
  )
}
