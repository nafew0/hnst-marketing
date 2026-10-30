'use client'

import cn from 'clsx'
import { useRef } from 'react'

import { useDeviceTier } from '@/components/motion/device-tier'
import { ScrollSequence } from '@/components/motion/scroll-sequence'
import { useScrollProgress } from '@/components/motion/use-scroll-progress'
import { Eyebrow, Heading } from '@/components/ui/heading'

import s from './scroll-film.module.css'

const MANIFEST_URL = '/posters/film/manifest.json'

/** The last stretch dissolves into S3's dunes, pinned right behind the film. */
const DISSOLVE_START = 0.93

interface Chapter {
  eyebrow: string
  heading: string
  body: string
  still: string
  end: number
}

/** A caption's opacity: in at the start of its chapter, out before its end. */
function captionOpacity(progress: number, start: number, end: number) {
  const fade = 0.04
  const inward = (progress - start) / fade
  const outward = (end - fade - progress) / fade
  return Math.min(1, Math.max(0, Math.min(inward, end === 1 ? 1 : outward)))
}

export function FilmTrack({ chapters }: { chapters: readonly Chapter[] }) {
  const { state } = useDeviceTier()
  const live = state?.motionMedia === true
  const rootRef = useRef<HTMLDivElement>(null)
  const captionsRef = useRef<HTMLDivElement>(null)
  const [first] = chapters

  const setTrackRef = useScrollProgress(
    (progress) => {
      const captions = captionsRef.current?.children
      if (captions) {
        chapters.forEach((chapter, i) => {
          const start = chapters[i - 1]?.end ?? 0
          const caption = captions[i]
          if (caption instanceof HTMLElement) {
            caption.style.opacity = String(
              captionOpacity(progress, start, chapter.end)
            )
          }
        })
      }
      if (rootRef.current) {
        rootRef.current.style.opacity = String(
          Math.min(1, (1 - progress) / (1 - DISSOLVE_START))
        )
      }
    },
    { start: 'top top', end: 'bottom bottom', disabled: !live }
  )

  return (
    <div
      ref={rootRef}
      className={s.film}
      data-static={state?.motionMedia === false || undefined}
      data-live={live || undefined}
    >
      <div ref={setTrackRef}>
        <ScrollSequence
          manifestUrl={MANIFEST_URL}
          poster={first?.still ?? ''}
          alt=""
          className={cn(s.filmTrack)}
        >
          <div ref={captionsRef} className={cn(s.captions, 'dr-layout-block')}>
            {chapters.map((chapter) => (
              <div key={chapter.heading} className={s.caption}>
                <Eyebrow>{chapter.eyebrow}</Eyebrow>
                <Heading as="h2" size="h1">
                  {chapter.heading}
                </Heading>
                <p className="p-big text-pretty text-starlight">
                  {chapter.body}
                </p>
              </div>
            ))}
          </div>
        </ScrollSequence>
      </div>
    </div>
  )
}
