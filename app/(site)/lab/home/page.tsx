import type { Metadata } from 'next'

import { Wrapper } from '@/components/layout/wrapper'
import { HomeSections } from '@/components/sections/signature/home-sections'

import { TierSwitch } from './tier-switch'

export const metadata: Metadata = {
  title: 'Homepage by tier (lab)',
  robots: { index: false, follow: false },
}

/** The homepage under a forced device tier: `/lab/home?tier=0…3`. */
export default async function LabHomePage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>
}) {
  const { tier } = await searchParams
  return (
    <Wrapper theme="dark" lenis={{}}>
      <TierSwitch initialTier={tier}>
        <HomeSections />
      </TierSwitch>
    </Wrapper>
  )
}
