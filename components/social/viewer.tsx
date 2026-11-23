'use client'

import { useRef, useState } from 'react'

import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'

import s from './social.module.css'

export interface PostView {
  id: number
  caption: string
  network: string
  url: string | null
  postedOn: string
  image: { src: string; alt: string; width: number; height: number }
}

/**
 * The post grid, three across like a profile, and a viewer for one post: its
 * picture, caption and a link out to the original. Native <dialog>: Esc and
 * the close button shut it, and focus returns to the tile.
 */
export function PostGrid({
  posts,
  viewLabel,
}: {
  posts: readonly PostView[]
  viewLabel: string
}) {
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
              aria-label={post.caption}
              onClick={() => show(post)}
            >
              <Image
                src={post.image.src}
                alt=""
                fill
                sizes="(min-width: 800px) 300px, 33vw"
              />
            </button>
          </li>
        ))}
      </ul>
      <dialog
        ref={dialogRef}
        className={s.viewer}
        aria-label={open?.caption ?? 'Post'}
        onClose={() => setOpen(null)}
      >
        {open && (
          <div className={s.post}>
            <Image
              src={open.image.src}
              alt={open.image.alt}
              width={open.image.width}
              height={open.image.height}
              sizes="(min-width: 800px) 560px, 100vw"
              className={s.postImage}
            />
            <p className={s.caption}>{open.caption}</p>
            <p className={s.meta}>{open.postedOn}</p>
            <div className={s.postActions}>
              {open.url && (
                <Link href={open.url} newTab className={s.out}>
                  {viewLabel} {open.network}
                  <span className="sr-only"> (opens in a new tab)</span>
                </Link>
              )}
              <button
                type="button"
                className={s.close}
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
