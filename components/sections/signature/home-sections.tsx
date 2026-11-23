import type { ReactNode } from 'react'

import { DraftMark } from './draft-mark'
import { GoldenPlatter } from './golden-platter'
import { Hero } from './hero'
import type { HomeCopy } from './home-copy'
import { HowItWorks } from './how-it-works'
import { Packages } from './packages'
import { ProofBooking } from './proof-booking'
import { ScrollFilm } from './scroll-film'
import { ScrollHairline } from './scroll-hairline'
import { TheTurn } from './the-turn'

/**
 * The homepage story, S1–S7. Shared by `/` and `/lab/home`, which renders it
 * under a tier override to check every section at every tier. `copy` is the
 * CMS's words over the originals (home-copy.ts).
 */
export function HomeSections({
  copy,
  offers,
}: {
  copy: HomeCopy
  /** In place of the priced packages (S6) while the home screen is on. */
  offers?: ReactNode
}) {
  return (
    <ScrollHairline>
      <Hero copy={copy.hero} />
      <ScrollFilm copy={copy.film} />
      <TheTurn copy={copy.turn} />
      <GoldenPlatter copy={copy.platter} />
      <HowItWorks copy={copy.steps} />
      {offers ?? <Packages copy={copy.packages} />}
      <ProofBooking copy={copy.proof} />
      <DraftMark />
    </ScrollHairline>
  )
}
