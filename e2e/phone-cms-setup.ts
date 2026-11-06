import { createHash, randomUUID } from 'node:crypto'

import { getPayload } from 'payload'
import sharp from 'sharp'

import { env } from '@/lib/env'
import config from '@/payload.config'

const database = new URL(env.DATABASE_URL ?? '')
if (
  !['127.0.0.1', 'localhost'].includes(database.hostname) ||
  !database.pathname.endsWith('_m3_review')
)
  throw new Error(
    'Phone CMS fixtures require a disposable local _m3_review database'
  )

const cms = await getPayload({ config })
try {
  for (const role of ['admin', 'editor'] as const) {
    const email = `m3-${role}@example.test`
    const found = await cms.find({
      collection: 'users',
      where: { email: { equals: email } },
    })
    if (!found.totalDocs)
      await cms.create({
        collection: 'users',
        data: { email, role, password: 'M3-disposable-local-fixture-only!' },
      })
  }
  const data = await sharp({
    create: { width: 800, height: 600, channels: 3, background: 'white' },
  })
    .webp()
    .toBuffer()
  for (const status of ['pending', 'approved', 'rejected'] as const) {
    const displayName = `M3 fixture ${status}`
    const found = await cms.find({
      collection: 'wallPhotos',
      where: { displayName: { equals: displayName } },
    })
    for (const doc of found.docs)
      await cms.delete({
        collection: 'wallPhotos',
        id: doc.id,
        context: { skipRevalidation: true },
      })
    await cms.create({
      collection: 'wallPhotos',
      context: { skipRevalidation: true },
      file: {
        data,
        mimetype: 'image/webp',
        name: `m3-${status}.webp`,
        size: data.length,
      },
      data: {
        publicId: randomUUID(),
        reports: 0,
        statusChangedAt: new Date().toISOString(),
        status,
        displayName,
        consentText: '[DRAFT] Test consent, exactly as shown.',
        consentAt: new Date().toISOString(),
        adult: true,
        removeTokenHash: createHash('sha256')
          .update('disposable-test-token')
          .digest('hex'),
      },
    })
  }
} finally {
  await cms.destroy()
}
process.exit(0)
