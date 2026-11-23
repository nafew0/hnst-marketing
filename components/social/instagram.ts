import { z } from 'zod'

import { env } from '@/lib/env'
import { fetchWithTimeout } from '@/utils/fetch'

/** A post from the live feed, as the grid draws it. */
export interface LivePost {
  id: string
  caption: string
  /** The picture, or a video's cover. Fetched and resized by our server. */
  image: string
  video: boolean
  permalink: string
  postedAt: string
}

const ALLOWED_IMAGE_HOSTS = /(^|\.)(cdninstagram\.com|fbcdn\.net)$/u

const media = z.object({
  id: z.string(),
  caption: z.string().nullish(),
  media_type: z.string(),
  media_url: z.url().nullish(),
  thumbnail_url: z.url().nullish(),
  permalink: z.url(),
  timestamp: z.string(),
})

const response = z.object({ data: z.array(z.unknown()) })

/**
 * Instagram's media list, as our posts. Rows that don't parse, or whose
 * picture isn't on Instagram's own image hosts (the only hosts the image
 * optimizer may fetch, next.config.ts), are left out.
 */
export function parseInstagramMedia(json: z.input<typeof response>) {
  const parsed = response.safeParse(json)
  if (!parsed.success) return []
  return parsed.data.data.flatMap((row): LivePost[] => {
    const item = media.safeParse(row)
    if (!item.success) return []
    const video = item.data.media_type === 'VIDEO'
    const image = video ? item.data.thumbnail_url : item.data.media_url
    if (!image || !ALLOWED_IMAGE_HOSTS.test(new URL(image).hostname)) return []
    return [
      {
        id: item.data.id,
        caption: item.data.caption?.trim() ?? '',
        image,
        video,
        permalink: item.data.permalink,
        postedAt: item.data.timestamp,
      },
    ]
  })
}

const FIELDS =
  'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp'

/**
 * HONEST's latest Instagram posts, read by our server (never the visitor's
 * browser, so Meta sees no visitor) and cached for an hour. Null without a
 * token or when Instagram doesn't answer: the page then shows our own posts.
 */
export async function getInstagramPosts(limit = 24) {
  const token = env.INSTAGRAM_ACCESS_TOKEN
  if (!token) return null
  try {
    const result = await fetchWithTimeout(
      `https://graph.instagram.com/me/media?fields=${FIELDS}&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600, tags: ['instagram'] },
      }
    )
    if (!result.ok) {
      console.error(
        `Instagram feed: HTTP ${result.status}; showing our own posts`
      )
      return null
    }
    const posts = parseInstagramMedia(await result.json())
    return posts.length ? posts : null
  } catch {
    console.error('Instagram feed unavailable; showing our own posts')
    return null
  }
}
