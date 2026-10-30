import { revalidatePath, revalidateTag } from 'next/cache'
import type { CollectionConfig, GlobalConfig } from 'payload'

function invalidate() {
  revalidateTag('honest-cms', { expire: 0 })
  for (const route of [
    '/packages',
    '/contact',
    '/how-it-works',
    '/about',
    '/proof',
    '/the-honest-marketer',
    '/book',
    '/thanks',
    '/link-in-bio',
    '/legal',
    '/sitemap.xml',
    '/llms.txt',
  ])
    revalidatePath(route, 'layout')
}
export const contentHooks: NonNullable<CollectionConfig['hooks']> = {
  afterChange: [
    ({ doc, req }) => {
      if (!req.context.skipRevalidation) invalidate()
      return doc
    },
  ],
  afterDelete: [
    ({ doc, req }) => {
      if (!req.context.skipRevalidation) invalidate()
      return doc
    },
  ],
}
export const settingsHooks: NonNullable<GlobalConfig['hooks']> = {
  afterChange: [
    ({ doc, req }) => {
      if (!req.context.skipRevalidation) invalidate()
      return doc
    },
  ],
}
