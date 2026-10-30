import { getPayload } from 'payload'

import { env } from '@/lib/env'
import config from '@/payload.config'
// Disposable local/CI fixtures. Never run this against a customer database.
const database = new URL(env.DATABASE_URL ?? '')
if (!['127.0.0.1', 'localhost'].includes(database.hostname))
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
      collection: 'users',
      data: { email, role, password: 'P3-disposable-local-fixture-only!' },
    })
}
await cms.destroy()
process.exit(0)
