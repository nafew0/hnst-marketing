'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { Image } from '@/components/ui/image'
import { useDeviceDetection } from '@/hooks/use-device-detection'

import type { PostImage } from './viewer'

import s from './social.module.css'

export interface Highlight {
  id: string
  title: string
  cover: PostImage
  slides: readonly { id: string; image: PostImage; caption: string }[]
}

/** How long a slide stays before the next, as on Instagram. */
const SLIDE_MS = 5000

/**
 * The highlight circles under the bio, and the slides each one opens: tap the
 * right half or Next to go on, the left half or Previous to go back, Esc or
 * Close to stop. Slides move on by themselves unless motion is reduced.
 */
export function Highlights({ items }: { items: readonly Highlight[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState<{ at: number; slide: number } | null>(null)
  const { isReducedMotion } = useDeviceDetection()
  const highlight = open ? items[open.at] : undefined
  const slide = open && highlight ? highlight.slides[open.slide] : undefined
  const auto = isReducedMotion === false

  const close = () => dialogRef.current?.close()
  const step = (by: 1 | -1) => {
    if (!open || !highlight) return
    const next = open.slide + by
    if (next < 0) return
    if (next < highlight.slides.length) setOpen({ ...open, slide: next })
    else if (open.at + 1 < items.length) setOpen({ at: open.at + 1, slide: 0 })
    else close()
  }

  const advance = useEffectEvent(() => step(1))
  useEffect(() => {
    if (!auto || !open) return
    const timer = setTimeout(advance, SLIDE_MS)
    return () => clearTimeout(timer)
  }, [auto, open])

  if (!items.length) return null
  return (
    <>
      <ul className={s.highlights} aria-label="Highlights">
        {items.map((item, at) => (
          <li key={item.id}>
            <button
              type="button"
              className={s.highlight}
              onClick={() => {
                setOpen({ at, slide: 0 })
                dialogRef.current?.showModal()
              }}
            >
              <span className={s.ring}>
                <Image src={item.cover.src} alt="" fill sizes="80px" />
              </span>
              <span className={s.highlightTitle}>{item.title}</span>
            </button>
          </li>
        ))}
      </ul>
      <dialog
        ref={dialogRef}
        className={s.story}
        aria-label={highlight?.title ?? 'Highlight'}
        onClose={() => setOpen(null)}
      >
        {highlight && slide && open && (
          <div className={s.storyBody}>
            <ol className={s.progress} aria-hidden="true">
              {highlight.slides.map((item, index) => (
                <li
                  key={item.id}
                  data-done={index < open.slide || undefined}
                  data-now={index === open.slide || undefined}
                  data-auto={auto || undefined}
                />
              ))}
            </ol>
            <p className={s.storyTitle}>{highlight.title}</p>
            <span key={`${open.at}-${open.slide}`} className={s.storyImage}>
              <Image
                src={slide.image.src}
                alt={slide.image.alt}
                fill
                sizes="(min-width: 800px) 420px, 100vw"
                objectFit="contain"
              />
            </span>
            {slide.caption && <p className={s.storyCaption}>{slide.caption}</p>}
            <div className={s.storyNav}>
              <button
                type="button"
                className={s.storyHalf}
                aria-label="Previous"
                onClick={() => step(-1)}
              />
              <button
                type="button"
                className={s.storyHalf}
                aria-label="Next"
                onClick={() => step(1)}
              />
            </div>
            <button type="button" className={s.storyClose} onClick={close}>
              Close
            </button>
          </div>
        )}
      </dialog>
    </>
  )
}
