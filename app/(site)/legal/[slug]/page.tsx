import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageShell, PageHero } from '@/components/sections/standard/catalog'
import { Section, Container } from '@/components/ui/section'
import { getLegal } from '@/lib/cms/data'
import { legalSlugs } from '@/lib/cms/seed-data'
import { routeAlternates } from '@/lib/seo/alternates'
interface Props {
  params: Promise<{ slug: string }>
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const doc = await getLegal(slug)
  return {
    title: doc?.title ?? 'Policy not available',
    alternates: routeAlternates(`/legal/${slug}`),
    robots: {
      index: doc?.status === 'published' && doc._status === 'published',
      follow: true,
    },
  }
}
export default async function LegalPage({ params }: Props) {
  const { slug } = await params
  const doc = await getLegal(slug)
  if (!doc) {
    if (!legalSlugs.some((value) => value === slug)) notFound()
    return (
      <PageShell>
        <PageHero
          title="This policy is being prepared."
          description="The approved policy will appear here before public launch."
          eyebrow="NOT YET PUBLISHED"
        />
      </PageShell>
    )
  }
  return (
    <PageShell>
      <PageHero
        title={doc.title}
        eyebrow={
          doc.status === 'draft' ? '[DRAFT] — EDITOR PREVIEW' : 'THE DETAILS'
        }
      />
      <Section theme="light">
        <Container className="max-w-[850px] p">
          {doc.effectiveDate && (
            <p className="dr-mb-24">
              Effective{' '}
              {new Date(doc.effectiveDate).toLocaleDateString('en-US', {
                timeZone: 'UTC',
              })}{' '}
              · Version {doc.version}
            </p>
          )}
          <RichText data={doc.body} />
        </Container>
      </Section>
    </PageShell>
  )
}
