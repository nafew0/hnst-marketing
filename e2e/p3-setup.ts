import { getPayload } from 'payload'

import { env } from '@/lib/env'
import config from '@/payload.config'
// Disposable local/CI fixtures. Never run this against a customer database.
const database = new URL(env.DATABASE_URL ?? '')
if (
  !['127.0.0.1', 'localhost'].includes(database.hostname) ||
  !database.pathname.endsWith('_p3_review')
)
  throw new Error('P3 fixtures require a local database')
const cms = await getPayload({ config })
for (const role of ['admin', 'editor'] as const) {
  const email = `p3-${role}@example.test`
  const found = await cms.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  })
  if (!found.totalDocs)
    await cms.create({
      context: { skipRevalidation: true },
      collection: 'users',
      data: { email, role, password: 'P3-disposable-local-fixture-only!' },
    })
}
const packages = await cms.find({ collection: 'packages', limit: 4 })
for (const item of packages.docs)
  await cms.update({
    collection: 'packages',
    id: item.id,
    data: { _status: 'published' },
    context: { skipRevalidation: true },
  })
await cms.updateGlobal({
  slug: 'site-settings',
  data: { consentTexts: { approved: true } },
  context: { skipRevalidation: true },
})
await cms.destroy()
process.exit(0)
