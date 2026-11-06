import assert from 'node:assert/strict'

import { getPayload } from 'payload'

import { phoneSettingsSchema } from '@/components/ui/phone/settings'
import { richText } from '@/lib/cms/seed-data'
import { seedPhone } from '@/lib/cms/seed-phone'
import { env } from '@/lib/env'
import config from '@/payload.config'

const database = new URL(env.DATABASE_URL ?? '')
if (
  !['127.0.0.1', 'localhost'].includes(database.hostname) ||
  !database.pathname.endsWith('_m3_review')
)
  throw new Error('Seed checks require a disposable local _m3_review database')

const cms = await getPayload({ config })
const context = { skipRevalidation: true }
try {
  const privacy = (
    await cms.find({
      collection: 'legal-docs',
      where: { slug: { equals: 'privacy' } },
      limit: 1,
    })
  ).docs[0]
  assert(privacy)
  const publishedBody = richText(
    'Synthetic published privacy fixture. Preserve this version.'
  )
  await cms.update({
    collection: 'legal-docs',
    id: privacy.id,
    context,
    data: { body: publishedBody, status: 'published', _status: 'published' },
  })
  await seedPhone(cms)
  const publicPrivacy = await cms.findByID({
    collection: 'legal-docs',
    id: privacy.id,
    overrideAccess: false,
  })
  assert.deepEqual(publicPrivacy.body, publishedBody)
  const firstDraft = await cms.findByID({
    collection: 'legal-docs',
    id: privacy.id,
    draft: true,
  })
  assert(JSON.stringify(firstDraft.body).includes('[DRAFT] HONEST photo wall'))
  await seedPhone(cms)
  const secondDraft = await cms.findByID({
    collection: 'legal-docs',
    id: privacy.id,
    draft: true,
  })
  assert.deepEqual(secondDraft.body, firstDraft.body)
  assert.equal(
    (
      await cms.find({
        collection: 'legal-docs',
        where: { slug: { equals: 'wall-rules' } },
      })
    ).totalDocs,
    1
  )
  assert.equal(
    (
      await cms.find({
        collection: 'legal-docs',
        overrideAccess: false,
        where: { slug: { equals: 'wall-rules' } },
      })
    ).totalDocs,
    0
  )
  const settings = await cms.findGlobal({ slug: 'site-settings', draft: true })
  assert(phoneSettingsSchema.safeParse(settings.phone).success)
  assert.equal(settings.phone?.approved, false)
  console.log(
    'Seed checks passed: published privacy preserved, draft append is idempotent, wall rules remain private, phone schema matches M1.'
  )
} finally {
  await cms.destroy()
}
process.exit(0)
