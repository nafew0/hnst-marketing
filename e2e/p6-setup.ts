import { getPayload } from 'payload'

import { wave3Faqs, wave3Pages } from '@/lib/cms/wave3-data'
import { env } from '@/lib/env'
import config from '@/payload.config'
const database = new URL(env.DATABASE_URL ?? '')
if (
  !['127.0.0.1', 'localhost'].includes(database.hostname) ||
  !database.pathname.endsWith('_e2e_p3_review')
)
  throw new Error('P6 fixtures require the isolated browser-test database')
const cms = await getPayload({ config })
for (const page of wave3Pages) {
  const records = await cms.find({
    collection: 'pages',
    where: { slug: { equals: page.slug } },
    limit: 1,
  })
  const record = records.docs[0]
  if (!record)
    throw new Error('Seed Wave 3 drafts before preparing browser fixtures')
  await cms.update({
    collection: 'pages',
    id: record.id,
    data: { ...page, _status: 'published' },
    context: { skipRevalidation: true },
  })
}
for (const faq of wave3Faqs) {
  const records = await cms.find({
    collection: 'faqs',
    where: { question: { equals: faq.question } },
    limit: 1,
  })
  const record = records.docs[0]
  if (!record)
    throw new Error('Seed Wave 3 FAQ drafts before preparing browser fixtures')
  await cms.update({
    collection: 'faqs',
    id: record.id,
    data: { ...faq, _status: 'published' },
    context: { skipRevalidation: true },
  })
}
const settings = await cms.findGlobal({ slug: 'site-settings', draft: true })
await cms.updateGlobal({
  slug: 'site-settings',
  context: { skipRevalidation: true },
  data: {
    _status: 'published',
    consentTexts: { ...settings.consentTexts, approved: true },
    qualifyingQuestions: settings.qualifyingQuestions ?? [],
    bookingEmbedUrl: 'https://api.leadconnectorhq.com/p6-calendar-fixture',
    toolCostDisclosure: settings.toolCostDisclosure ?? null,
  },
})
await cms.destroy()
console.log(
  'Disposable P6 browser fixtures prepared; no review CMS content was published.'
)
process.exit(0)
