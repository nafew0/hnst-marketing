import { unstable_cache } from 'next/cache'
import { draftMode, headers } from 'next/headers'
import { getPayload } from 'payload'
import { cache } from 'react'

import { env } from '@/lib/env'
export const getCms = cache(async () => {
  if (!env.DATABASE_URL || !env.PAYLOAD_SECRET) return null
  const { default: config } = await import('@/payload.config')
  return getPayload({ config })
})
export const readContext = cache(async () => {
  const cms = await getCms()
  if (!cms) return null
  const { isEnabled } = await draftMode()
  const auth = isEnabled ? await cms.auth({ headers: await headers() }) : null
  const user = auth?.user ?? null
  return {
    cms,
    preview: isEnabled && (user?.role === 'admin' || user?.role === 'editor'),
    user,
  }
})
export const getPackages = cache(async () => {
  const ctx = await readContext()
  if (!ctx) return []
  const result = await ctx.cms.find({
    collection: 'packages',
    overrideAccess: false,
    user: ctx.user,
    draft: ctx.preview,
    where: ctx.preview ? {} : { _status: { equals: 'published' } },
    sort: 'order',
    limit: 4,
    depth: 1,
  })
  return result.docs
})
export const getPage = cache(async (slug: string) => {
  const ctx = await readContext()
  if (!ctx) return null
  const result = await ctx.cms.find({
    collection: 'pages',
    overrideAccess: false,
    user: ctx.user,
    draft: ctx.preview,
    where: {
      and: [
        { slug: { equals: slug } },
        ...(ctx.preview ? [] : [{ _status: { equals: 'published' } }]),
      ],
    },
    limit: 1,
  })
  return result.docs[0] ?? null
})
export const getLegal = cache(async (slug: string) => {
  const ctx = await readContext()
  if (!ctx) return null
  const result = await ctx.cms.find({
    collection: 'legal-docs',
    overrideAccess: false,
    user: ctx.user,
    draft: ctx.preview,
    where: {
      and: [
        { slug: { equals: slug } },
        ...(ctx.preview
          ? []
          : [
              { status: { equals: 'published' } },
              { _status: { equals: 'published' } },
            ]),
      ],
    },
    limit: 1,
  })
  return result.docs[0] ?? null
})
export const getSettings = unstable_cache(
  async () => {
    const cms = await getCms()
    return cms
      ? cms.findGlobal({ slug: 'site-settings', overrideAccess: false })
      : null
  },
  ['honest-settings'],
  { tags: ['honest-cms'], revalidate: 3600 }
)
export const getFaqs = cache(async () => {
  const ctx = await readContext()
  if (!ctx) return []
  return (
    await ctx.cms.find({
      collection: 'faqs',
      overrideAccess: false,
      user: ctx.user,
      draft: ctx.preview,
      where: ctx.preview ? {} : { _status: { equals: 'published' } },
      sort: 'order',
      limit: 100,
    })
  ).docs
})
