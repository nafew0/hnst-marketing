import { filmCopy } from '@/components/sections/signature/copy'
import { Heading } from '@/components/ui/heading'
import { Image } from '@/components/ui/image'

import { FilmTrack } from './film-track'

import s from './scroll-film.module.css'

/**
 * S2. With motion: a scroll-scrubbed film with the captions pinned at the left.
 * Reduced motion and Save-Data (tier 0) get the same story as three stills, one
 * under the other, with no scroll trickery. Both are in the HTML; CSS and the
 * tier pick one.
 */
export function ScrollFilm() {
  return (
    <section className={s.section} aria-label={filmCopy.title}>
      <FilmTrack
        pinnedLine={filmCopy.pinnedLine}
        chapters={filmCopy.chapters}
      />

      <div className={s.stills}>
        <div className="dr-layout-block">
          <Heading as="h2" size="h2">
            {filmCopy.pinnedLine}
          </Heading>
        </div>
        {filmCopy.chapters.map((chapter) => (
          <article key={chapter.label} className={s.still}>
            <div className={s.stillImage}>
              <div className="absolute inset-0 desktop-only">
                <Image
                  src={chapter.still}
                  alt={chapter.alt}
                  fill
                  sizes="100vw"
                />
              </div>
              <div className="absolute inset-0 mobile-only">
                <Image
                  src={chapter.stillMobile}
                  alt={chapter.alt}
                  fill
                  sizes="100vw"
                />
              </div>
            </div>
            <div className="dr-layout-block flex flex-col dr-gap-12">
              <Heading as="h3" size="h1">
                {chapter.label}
              </Heading>
              <p className="max-w-[46ch] p-big text-pretty text-silver">
                {chapter.body}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
