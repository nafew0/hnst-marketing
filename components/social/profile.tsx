import { cmsImage } from '@/components/apps/shared/cms'
import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import { Container, Section } from '@/components/ui/section'
import { getSocialPosts } from '@/lib/cms/data'
import type { Page } from '@/lib/cms/payload-types'

import { NETWORK_LABELS, ownProfiles } from './networks'
import { PostGrid, type PostView } from './viewer'

import s from './social.module.css'

type ProfileBlock = Extract<
  NonNullable<Page['blocks']>[number],
  { blockType: 'socialProfile' }
>

const isNetwork = (value: string): value is keyof typeof NETWORK_LABELS =>
  value in NETWORK_LABELS

/**
 * The social media page (21 Nov 2026): HONEST's profile, a follow button for
 * each real profile, and the post grid. Everything links out; no embeds, no
 * network scripts, no pixels.
 */
export async function SocialProfile({
  block,
  links,
}: {
  block: ProfileBlock
  /** Site settings → Social profiles. */
  links: readonly { url: string }[]
}) {
  const posts: PostView[] = (await getSocialPosts()).flatMap((post) => {
    const image = cmsImage(post.image)
    if (!image) return []
    return [
      {
        id: post.id,
        caption: post.caption,
        network: isNetwork(post.network)
          ? NETWORK_LABELS[post.network]
          : post.network,
        url: post.url ?? null,
        postedOn: new Date(post.postedAt).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        image,
      },
    ]
  })
  const profiles = ownProfiles(links)

  return (
    <Section>
      <Container className="flex flex-col dr-gap-32">
        <header className={s.head}>
          <span className={s.avatar} aria-hidden="true">
            H
          </span>
          <div className="flex min-w-0 flex-col dr-gap-8">
            <h1 className="h2 text-balance">{block.title}</h1>
            {block.handle && <p className="p text-silver">{block.handle}</p>}
            {block.bio && (
              <p className="max-w-[60ch] p text-pretty">{block.bio}</p>
            )}
          </div>
        </header>

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

        <section
          aria-labelledby="social-posts"
          className="flex flex-col dr-gap-16"
        >
          <h2 id="social-posts" className="h3">
            {block.postsHeading ?? 'Posts'}
          </h2>
          {posts.length ? (
            <PostGrid posts={posts} viewLabel={block.viewLabel ?? 'View on'} />
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
