import { readFile } from 'node:fs/promises'

import { getPayload } from 'payload'
import { z } from 'zod'

import { wave3Faqs, wave3Pages } from '@/lib/cms/wave3-data'
import config from '@/payload.config'

/** Add drafts without replacing editor changes or publishing marketing copy. */
export async function seedWave3(inputPath?: string) {
  const cms = await getPayload({ config })
  for (const page of wave3Pages) {
    const found = await cms.find({
      collection: 'pages',
      where: { slug: { equals: page.slug } },
      draft: true,
      limit: 1,
    })
    if (!found.totalDocs)
      await cms.create({
        collection: 'pages',
        draft: true,
        data: page,
        context: { skipRevalidation: true },
      })
  }
  for (const faq of wave3Faqs) {
    const found = await cms.find({
      collection: 'faqs',
      where: { question: { equals: faq.question } },
      draft: true,
      limit: 1,
    })
    const existing = found.docs[0]
    if (!existing)
      await cms.create({
        collection: 'faqs',
        draft: true,
        data: faq,
        context: { skipRevalidation: true },
      })
    else if (existing.answer === 'DRAFT — Answer awaiting Founder approval.')
      await cms.update({
        collection: 'faqs',
        id: existing.id,
        draft: true,
        data: faq,
        context: { skipRevalidation: true },
      })
  }
  if (inputPath) {
    const input = await readFile(inputPath, 'utf8')
    const candidate = input.match(
      /\*\*Booking embed URL:\*\*\s*`([^`]+)`/u
    )?.[1]
    const parsed = z.url().safeParse(candidate)
    if (
      !parsed.success ||
      new URL(parsed.data).origin !== 'https://api.leadconnectorhq.com'
    )
      throw new Error(
        'Provide the approved calendar address in the private Wave 3 inputs file.'
      )
    // The Founder approved this configuration value. It stays in Postgres only.
    // Payload merges an update over the latest version, so publishing while a
    // draft is pending would publish that draft's unapproved copy with it.
    const latest = await cms.findGlobal({
      slug: 'site-settings',
      draft: true,
    })
    const draftPending = latest._status === 'draft'
    await cms.updateGlobal({
      slug: 'site-settings',
      draft: draftPending,
      data: {
        bookingEmbedUrl: parsed.data,
        _status: draftPending ? 'draft' : 'published',
      },
      context: { skipRevalidation: true },
    })
    if (draftPending)
      console.log(
        'Saved the calendar address to the pending SiteSettings draft. It goes live when that draft is published.'
      )
  }
  const settings = await cms.findGlobal({ slug: 'site-settings', draft: true })
  if (!settings.qualifyingQuestions?.length)
    await cms.updateGlobal({
      slug: 'site-settings',
      draft: true,
      context: { skipRevalidation: true },
      data: {
        _status: 'draft',
        publicEmail: 'service@hnst.marketing',
        toolCostDisclosure:
          'Tools are billed to you directly by their providers and aren’t included in the package price: Google Workspace $8.40/month per seat, X or Grok about $8–$200/month, GoHighLevel $97/month. That’s about $115–$310/month in total.',
        qualifyingQuestions: [
          {
            question:
              'What’s the one thing you most want your marketing to do right now?',
          },
          {
            question:
              'Which package are you leaning toward? (Not sure yet / Basic DIY / Executive / Founder Package / Diamond)',
          },
          { question: 'Is there a reason we wouldn’t do business together?' },
        ],
      },
    })
  await cms.destroy()
  console.log(
    'Wave 3 content saved as drafts. Calendar configuration, when supplied, was saved only in the CMS.'
  )
}
if (import.meta.main) {
  await seedWave3(process.argv[2])
  process.exit(0)
}
