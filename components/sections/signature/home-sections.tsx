import { DraftMark } from './draft-mark'
import { GoldenPlatter } from './golden-platter'
import { Hero } from './hero'
import { HowItWorks } from './how-it-works'
import { Packages } from './packages'
import { ProofBooking } from './proof-booking'
import { ScrollFilm } from './scroll-film'
import { ScrollHairline } from './scroll-hairline'
import { TheTurn } from './the-turn'

/**
 * The homepage story, S1–S7. Shared by `/` and `/lab/home`, which renders it
 * under a tier override to check every section at every tier.
 */
export function HomeSections() {
  return (
    <ScrollHairline>
      <Hero />
      <ScrollFilm />
      <TheTurn />
      <GoldenPlatter />
      <HowItWorks />
      <Packages />
      <ProofBooking />
      <DraftMark />
    </ScrollHairline>
  )
}
