import { getPayload } from 'payload'

import { legalSlugs, packageSeeds, richText } from '@/lib/cms/seed-data'
import config from '@/payload.config'
/** Idempotent and additive: never replace an editor's existing content. */
export async function seed() {
  const cms = await getPayload({ config })
  for (const slug of legalSlugs) {
    const existing = await cms.find({
      collection: 'legal-docs',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    if (!existing.totalDocs)
      await cms.create({
        context: { skipRevalidation: true },
        collection: 'legal-docs',
        data: {
          slug,
          title: slug.split('-').join(' '),
          body: richText(
            'DRAFT — Legal wording is awaiting approval. This placeholder is not a published policy.'
          ),
          version: 'draft-1',
          status: 'draft',
          _status: 'draft',
        },
      })
  }
  for (const data of packageSeeds) {
    const existing = await cms.find({
      collection: 'packages',
      where: { tier: { equals: data.tier } },
      limit: 1,
    })
    if (!existing.totalDocs)
      await cms.create({
        context: { skipRevalidation: true },
        collection: 'packages',
        data,
      })
  }
  const questions = [
    'How does the process begin?',
    'Who owns the finished system?',
    'What does each package include?',
    'Which tools do I need?',
    'When does the delivery window start?',
    'How do revisions work?',
    'How is content reviewed?',
    'Can I upgrade my package?',
    'How is my website handed over?',
    'What support is included?',
  ]
  for (const [order, question] of questions.entries()) {
    const existing = await cms.find({
      collection: 'faqs',
      where: { question: { equals: question } },
      limit: 1,
    })
    if (!existing.totalDocs)
      await cms.create({
        context: { skipRevalidation: true },
        collection: 'faqs',
        data: {
          question,
          answer: 'DRAFT — Answer awaiting Founder approval.',
          category: 'process',
          order,
          _status: 'draft',
        },
      })
  }
  const pageSeeds = [
    {
      slug: 'packages',
      title: 'A complete system. Your way.',
      description:
        'From learning the process yourself to having it done for you. Compare the four HONEST Marketing packages.',
      blocks: [
        {
          blockType: 'hero' as const,
          eyebrow: 'THE HONEST PACKAGES',
          title: 'A complete system. Your way.',
          description: 'Choose the support that fits your next chapter.',
        },
        {
          blockType: 'packageGrid' as const,
          title: 'Find your starting point',
        },
        {
          blockType: 'comparisonTable' as const,
          title: 'The details, side by side',
        },
      ],
    },
    {
      slug: 'contact',
      title: 'Let’s talk about what’s next.',
      description:
        'Tell HONEST Marketing about your business and the marketing system you want to build.',
      blocks: [
        {
          blockType: 'hero' as const,
          eyebrow: 'A CONVERSATION, FIRST',
          title: 'Let’s talk about what’s next.',
          description:
            'Tell us where you are, and where you want to go. We’ll take it from there.',
        },
      ],
    },
    {
      slug: 'link-in-bio',
      title: 'Your next step starts here.',
      description: 'Explore HONEST Marketing packages or start a conversation.',
      blocks: [
        {
          blockType: 'hero' as const,
          eyebrow: 'HONEST MARKETING',
          title: 'Your next step starts here.',
          description: 'A little less searching. A clear next step.',
        },
      ],
    },
  ]
  for (const page of pageSeeds) {
    const existing = await cms.find({
      collection: 'pages',
      where: { slug: { equals: page.slug } },
      limit: 1,
    })
    if (!existing.totalDocs)
      await cms.create({
        context: { skipRevalidation: true },
        collection: 'pages',
        data: {
          title: page.title,
          slug: page.slug,
          seo: { title: page.title, description: page.description },
          blocks: page.blocks,
          _status: 'published',
        },
      })
  }
  const settings = await cms.findGlobal({ slug: 'site-settings' })
  if (!settings.consentTexts?.email)
    await cms.updateGlobal({
      context: { skipRevalidation: true },
      slug: 'site-settings',
      data: {
        companyLegalName: 'Honest Media Group LLC DBA Honest Marketing',
        consentTexts: {
          email:
            'I agree to receive emails from HONEST Marketing. Unsubscribe any time.',
          sms: 'I agree to receive text messages from HONEST Marketing about my enquiry. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help.',
          approved: false,
        },
        toolCostDisclosure:
          'Third-party tools and subscriptions are paid separately. Confirm your package’s current tool requirements and costs before purchase.',
      },
    })
  await cms.destroy()
  console.log(
    'CMS seed completed. Existing records were preserved; legal and FAQ content remains draft.'
  )
}
if (import.meta.main) {
  await seed()
  process.exit(0)
}
