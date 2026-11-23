import { cmsImage } from '@/components/apps/shared/cms'
import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import { Container, Section } from '@/components/ui/section'
import { getSocialPosts } from '@/lib/cms/data'
import type { Page } from '@/lib/cms/payload-types'

import { type Highlight, Highlights } from './highlights'
import { getInstagramPosts } from './instagram'
import { ownProfiles } from './networks'
import { PostGrid, type PostView } from './viewer'

import s from './social.module.css'

type ProfileBlock = Extract<
  NonNullable<Page['blocks']>[number],
  { blockType: 'socialProfile' }
>

const COVER_FALLBACK = {
  src: '/worlds/astronaut-window.webp',
  alt: '',
  width: 1280,
  height: 720,
}

const day = (at: string) =>
  new Date(at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

/** The grid's posts: the live Instagram feed when chosen and reachable, else ours. */
async function feed(block: ProfileBlock): Promise<PostView[]> {
  if (block.source === 'instagram') {
    const live = await getInstagramPosts()
    if (live)
      return live.map((post) => ({
        id: post.id,
        caption: post.caption,
        postedOn: day(post.postedAt),
        image: { src: post.image, alt: post.caption.slice(0, 120) },
        video: post.video,
        link: {
          href: post.permalink,
          label: block.viewLabel ?? 'View on Instagram',
        },
      }))
  }
  return (await getSocialPosts()).flatMap((post) => {
    const image = cmsImage(post.image)
    if (!image) return []
    return [
      {
        id: String(post.id),
        caption: post.caption,
        postedOn: day(post.postedAt),
        image,
        video: false,
      },
    ]
  })
}

function highlights(block: ProfileBlock): Highlight[] {
  return (block.highlights ?? []).flatMap((item, index) => {
    const cover = cmsImage(item.cover)
    const slides = (item.slides ?? []).flatMap((slide, at) => {
      const image = cmsImage(slide.image)
      return image
        ? [{ id: slide.id ?? String(at), image, caption: slide.caption ?? '' }]
        : []
    })
    return cover && slides.length
      ? [{ id: item.id ?? String(index), title: item.title, cover, slides }]
      : []
  })
}

/**
 * The social media page (20–21 Nov 2026): our own profile, made on our site
 * and shown like a social profile, so visitors stay here. Cover photo,
 * profile photo, bio, follow buttons for real profiles only, highlights, and
 * the post grid. No embeds, no network scripts, no pixels.
 */
export async function SocialProfile({
  block,
  links,
}: {
  block: ProfileBlock
  /** Site settings → Social profiles. */
  links: readonly { url: string }[]
}) {
  const posts = await feed(block)
  const profiles = ownProfiles(links)
  const cover = cmsImage(block.cover) ?? COVER_FALLBACK
  const avatar = cmsImage(block.avatar)

  return (
    <Section spacing="none" className="dr-pb-72">
      <div className={s.cover}>
        <Image
          src={cover.src}
          alt=""
          fill
          sizes="(min-width: 800px) 1240px, 100vw"
          preload
        />
      </div>
      <Container className="flex flex-col dr-gap-24">
        <header className={s.head}>
          <span className={s.avatar}>
            {avatar ? (
              <Image
                src={avatar.src}
                alt={avatar.alt}
                fill
                sizes="(min-width: 800px) 140px, 96px"
              />
            ) : (
              <span aria-hidden="true">H</span>
            )}
          </span>
          <div className="flex min-w-0 flex-col dr-gap-8">
            <h1 className="h2 text-balance">{block.title}</h1>
            {block.handle && <p className="p text-silver">{block.handle}</p>}
          </div>
        </header>
        {block.bio && <p className="max-w-[60ch] p text-pretty">{block.bio}</p>}

        {profiles.length > 0 && (
          <ul className={s.follow}>
            {profiles.map((profile) => (
              <li key={profile.network}>
                <Link href={profile.url} newTab className={s.followLink}>
                  <Image
                    src={`/social/${profile.network}.png`}
                    alt=""
                    width={20}
                    height={20}
                    sizes="20px"
                  />
                  {block.followLabel ?? 'Follow on'} {profile.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Highlights items={highlights(block)} />

        <section
          aria-labelledby="social-posts"
          className="flex flex-col dr-gap-16"
        >
          <h2 id="social-posts" className="h3">
            {block.postsHeading ?? 'Posts'}
          </h2>
          {posts.length ? (
            <PostGrid posts={posts} />
          ) : (
            <p className="max-w-[60ch] p text-pretty text-silver">
              {block.emptyText}
            </p>
          )}
        </section>
      </Container>
    </Section>
  )
}
