import { getPayload } from 'payload'

import { richText } from '@/lib/cms/seed-data'
import { env } from '@/lib/env'
import config from '@/payload.config'
const database = new URL(env.DATABASE_URL ?? '')
if (
  !['127.0.0.1', 'localhost'].includes(database.hostname) ||
  !database.pathname.endsWith('_e2e_p3_review')
)
  throw new Error(
    'M6 fixtures require a disposable local browser-test database'
  )
const cms = await getPayload({ config })
try {
  const existing = await cms.find({
    collection: 'phoneNotes',
    where: { title: { equals: 'M6 published fixture' } },
  })
  if (!existing.totalDocs)
    await cms.create({
      collection: 'phoneNotes',
      context: { skipRevalidation: true },
      data: {
        title: 'M6 published fixture',
        body: richText('A published editorial note for browser tests.'),
        order: 0,
        _status: 'published',
      },
    })
  const draft = await cms.find({
    collection: 'phoneNotes',
    where: { title: { equals: 'M6 private draft fixture' } },
  })
  if (!draft.totalDocs)
    await cms.create({
      collection: 'phoneNotes',
      context: { skipRevalidation: true },
      data: {
        title: 'M6 private draft fixture',
        body: richText('This unpublished note must stay private.'),
        order: 1,
        _status: 'draft',
      },
    })
} finally {
  await cms.destroy()
}
process.exit(0)
