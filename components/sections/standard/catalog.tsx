import { ScrollArea } from '@base-ui/react/scroll-area'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { Fragment, type ReactNode } from 'react'

import type { ConsentCopy } from '@/components/forms/lead-form'
import { Wrapper } from '@/components/layout/wrapper'
import { PackageReveal } from '@/components/sections/signature/package-reveal'
import { packageFacts } from '@/components/sections/standard/package-facts'
import { Wave3Block } from '@/components/sections/standard/wave3-blocks'
import { Heading } from '@/components/ui/heading'
import { Container, Section } from '@/components/ui/section'
import {
  type WorldClip,
  WorldBand,
  WorldClosing,
  WorldHero,
  worldFor,
  worldHost,
  WorldSky,
} from '@/components/world'
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
  return (
    <Wrapper lenis={false} className={worldHost}>
      <WorldSky />
      {children}
    </Wrapper>
  )
}
export function PageHero({
  title,
  description,
  eyebrow = 'HONEST MARKETING',
  clip = 'silk',
}: {
  title: string
  description?: string | null | undefined
  eyebrow?: string | null | undefined
  clip?: WorldClip
}) {
  return (
    <WorldHero
      clip={clip}
      title={title}
      eyebrow={eyebrow}
      description={description}
    />
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
      <div className="rounded-[16px] border bg-void-2 dr-px-32 dr-py-8">
        {items.map((item) => (
          <details
            key={item.id}
            className="border-b border-gold/20 dr-py-24 last:border-b-0"
          >
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
  const world = worldFor(page.slug)
  // After the first section, on pages with enough sections to want a break.
  const bandAfter = (page.blocks?.length ?? 0) > 3 ? 1 : -1
  return (
    <>
      {page.blocks?.map((block, index) => {
        if (block.blockType === 'hero')
          return (
            <PageHero
              key={block.id}
              clip={world.hero}
              title={block.title}
              description={block.description}
              eyebrow={block.eyebrow}
            />
          )
        if (block.blockType === 'cta')
          return (
            <WorldClosing
              key={block.id}
              clip={world.closing}
              title={block.title}
              description={block.description}
              href={block.href}
              label={block.label}
            />
          )
        return (
          <Fragment key={block.id}>
            <Section>
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
                {block.blockType === 'richText' && (
                  <div className="rounded-[16px] border bg-void-2 dr-p-32">
                    <RichText data={block.body} />
                  </div>
                )}
                <Wave3Block block={block} settings={settings} />
              </Container>
            </Section>
            {index === bandAfter && <WorldBand clip={world.band} />}
          </Fragment>
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
