import { z } from 'zod'

import type { Media, Page } from '@/lib/cms/payload-types'
import { APP_BASE_URL } from '@/lib/env'

/**
 * Reads the phone apps (M5) share with the pages they present: the same CMS
 * records, through the same loaders, so a phone view never says something
 * the page doesn't. Server only.
 */

export type ContentBlock = NonNullable<Page['blocks']>[number]

/** The first block of a type on a page, typed by that type. */
export function blockOf<Type extends ContentBlock['blockType']>(
  page: Page | null,
  type: Type
) {
  return page?.blocks?.find(
    (block): block is Extract<ContentBlock, { blockType: Type }> =>
      block.blockType === type
  )
}

export interface PhoneImage {
  src: string
  alt: string
  width: number
  height: number
}

const mediaSchema = z.object({
  url: z.string(),
  alt: z.string(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
})

/**
 * An uploaded image on this site, as the pages read it
 * (components/sections/standard/wave3-blocks.tsx, which keeps its own private).
 * Another origin's URL is refused.
 */
export function cmsImage(media: number | Media | null | undefined) {
  const parsed = mediaSchema.safeParse(media)
  if (!parsed.success) return null
  const url = new URL(parsed.data.url, APP_BASE_URL)
  if (url.origin !== new URL(APP_BASE_URL).origin) return null
  return {
    src: url.pathname,
    alt: parsed.data.alt,
    width: parsed.data.width ?? 1200,
    height: parsed.data.height ?? 800,
  } satisfies PhoneImage
}
