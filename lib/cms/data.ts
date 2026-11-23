import { unstable_cache } from 'next/cache'
import { draftMode, headers } from 'next/headers'
import { getPayload } from 'payload'
import { cache } from 'react'

import { homeScreenFrom } from '@/components/home-screen/copy'
import {
  PHONE_SETTINGS_DRAFT,
  phoneSettingsSchema,
} from '@/components/ui/phone/settings'
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
const getPublishedSettings = unstable_cache(
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

export const getSettings = cache(async () => {
  const ctx = await readContext()
  if (ctx?.preview)
    return ctx.cms.findGlobal({
      slug: 'site-settings',
      draft: true,
      user: ctx.user,
      overrideAccess: false,
    })
  return getPublishedSettings()
})

/** M2 consumes this boundary; missing/old CMS data remains explicitly unapproved. */
export const getPhoneSettings = cache(async () => {
  const settings = await getSettings()
  const parsed = phoneSettingsSchema.safeParse(settings?.phone)
  return parsed.success ? parsed.data : PHONE_SETTINGS_DRAFT
})

/** Published-only boundary for M2's static home and shell; never reads draftMode. */
export const getPublishedPhoneContent = cache(async () => {
  const settings = await getPublishedSettings()
  const parsed = phoneSettingsSchema.safeParse(settings?.phone)
  return {
    settings: parsed.success ? parsed.data : PHONE_SETTINGS_DRAFT,
    socialLinks: settings?.socialLinks ?? [],
    // The phone's Phone, Messages and Mail icons, and the desktop dock's.
    publicEmail: settings?.publicEmail ?? null,
    publicPhone: settings?.publicPhone ?? null,
  }
})

export const getPhoneNotes = cache(async () => {
  const ctx = await readContext()
  if (!ctx) return []
  return (
    await ctx.cms.find({
      collection: 'phoneNotes',
      overrideAccess: false,
      user: ctx.user,
      draft: ctx.preview,
      where: ctx.preview ? {} : { _status: { equals: 'published' } },
      sort: 'order',
      limit: 100,
    })
  ).docs
})

/**
 * The homepage's CMS words, published only, for the static `/`: the Homepage
 * global, the published packages (the cards' names and prices) and the
 * tool-costs note. Never reads draftMode. A missing CMS or table gives null,
 * and the page shows its original words (components/sections/signature/home-copy.ts).
 */
export const getPublishedHome = unstable_cache(
  async () => {
    const cms = await getCms()
    if (!cms) return null
    try {
      const [homepage, packages, settings] = await Promise.all([
        cms.findGlobal({ slug: 'homepage', overrideAccess: false }),
        cms.find({
          collection: 'packages',
          overrideAccess: false,
          where: { _status: { equals: 'published' } },
          sort: 'order',
          limit: 4,
          depth: 0,
        }),
        cms.findGlobal({ slug: 'site-settings', overrideAccess: false }),
      ])
      return {
        // An unpublished first draft isn't the homepage's words yet.
        homepage: homepage._status === 'draft' ? null : homepage,
        packages: packages.docs,
        toolCosts: settings.toolCostDisclosure ?? null,
      }
    } catch (error) {
      console.error(
        'homepage CMS read failed; showing the original words',
        error
      )
      return null
    }
  },
  ['honest-home'],
  { tags: ['honest-cms'], revalidate: 3600 }
)

/**
 * The home screen for the high-end offers (lib/cms/home-screen.ts), published
 * only, for the static `/` and the site layout. Never reads draftMode. Also the
 * published pages' titles, which the Call / Text / Email messages name. A
 * missing CMS or table gives the defaults, switched off.
 */
export const getPublishedHomeScreen = unstable_cache(
  async () => {
    const cms = await getCms()
    if (!cms) return { screen: homeScreenFrom(null), titles: [] }
    try {
      const [screen, pages] = await Promise.all([
        cms.findGlobal({ slug: 'home-screen', overrideAccess: false }),
        cms.find({
          collection: 'pages',
          overrideAccess: false,
          where: { _status: { equals: 'published' } },
          select: { slug: true, title: true },
          limit: 100,
          depth: 0,
        }),
      ])
      return {
        // An unpublished first draft isn't the screen yet.
        screen: homeScreenFrom(screen._status === 'draft' ? null : screen),
        titles: pages.docs.map((page) => ({
          path: `/${page.slug}`,
          title: page.title,
        })),
      }
    } catch (error) {
      console.error('home screen CMS read failed; it stays off', error)
      return {
        screen: homeScreenFrom(null),
        titles: [],
      }
    }
  },
  ['honest-home-screen'],
  { tags: ['honest-cms'], revalidate: 3600 }
)

/** The social page's own posts, newest first; drafts only in preview. */
export const getSocialPosts = cache(async () => {
  const ctx = await readContext()
  if (!ctx) return []
  try {
    return (
      await ctx.cms.find({
        collection: 'social-posts',
        overrideAccess: false,
        user: ctx.user,
        draft: ctx.preview,
        where: ctx.preview ? {} : { _status: { equals: 'published' } },
        sort: '-postedAt',
        limit: 60,
        depth: 1,
      })
    ).docs
  } catch (error) {
    console.error('social posts CMS read failed; showing none', error)
    return []
  }
})
