import { DraftMark } from './draft-mark'
import { GoldenPlatter } from './golden-platter'
import { Hero } from './hero'
import { HowItWorks } from './how-it-works'

/**
 * The homepage story, S1–S7. Shared by `/` and `/lab/home`, which renders it
 * under a tier override to check every section at every tier.
 */
export function HomeSections() {
  return (
    <>
      <Hero />
      <GoldenPlatter />
      <HowItWorks />
      <DraftMark />
    </>
  )
}
