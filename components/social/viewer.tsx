'use client'

import cn from 'clsx'
import { useRef, useState } from 'react'

import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'

import s from './social.module.css'

export interface PostImage {
  src: string
  alt: string
  width?: number | undefined
  height?: number | undefined
}

export interface PostView {
  id: string
  caption: string
  postedOn: string
  image: PostImage
  video: boolean
  /** The live feed's post on Instagram; our own posts have none. */
  link?: { href: string; label: string } | undefined
}

function Picture({ image, sizes }: { image: PostImage; sizes: string }) {
  if (image.width && image.height)
    return (
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        className={s.postImage}
      />
    )
  // The live feed doesn't say how big a picture is: a 4:5 frame, shown whole.
  return (
    <span className={s.postFrame}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        objectFit="contain"
      />
    </span>
  )
}

/**
 * The post grid, three across like a profile, and a viewer for one post: its
 * picture, caption and date, on our site. Native <dialog>: Esc and Close shut
 * it, and focus returns to the tile.
 */
export function PostGrid({ posts }: { posts: readonly PostView[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState<PostView | null>(null)

  const show = (post: PostView) => {
    setOpen(post)
    dialogRef.current?.showModal()
  }

  return (
    <>
      <ul className={s.grid}>
        {posts.map((post) => (
          <li key={post.id}>
            <button
              type="button"
              className={s.tile}
              aria-label={post.caption || `Post from ${post.postedOn}`}
              onClick={() => show(post)}
            >
              <Image
                src={post.image.src}
                alt=""
                fill
                sizes="(min-width: 800px) 300px, 33vw"
              />
              {post.video && (
                <span className={s.videoMark} aria-hidden="true">
                  <svg viewBox="0 0 12 12" focusable="false">
                    <path d="M3 2v8l7-4z" />
                  </svg>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <dialog
        ref={dialogRef}
        className={s.viewer}
        aria-label={open?.caption || 'Post'}
        onClose={() => setOpen(null)}
      >
        {open && (
          <div className={s.post}>
            <Picture
              image={open.image}
              sizes="(min-width: 800px) 560px, 100vw"
            />
            {open.caption && <p className={s.caption}>{open.caption}</p>}
            <p className={s.meta}>{open.postedOn}</p>
            <div className={s.postActions}>
              {open.link && (
                <Link href={open.link.href} newTab className={s.out}>
                  {open.link.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </Link>
              )}
              <button
                type="button"
                className={cn(s.close)}
                onClick={() => dialogRef.current?.close()}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
