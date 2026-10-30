'use client'

import { type ComponentProps, useRef } from 'react'

import { useSplitReveal } from '@/components/motion/use-split-reveal'
import { Heading } from '@/components/ui/heading'

/** A headline below the fold whose lines rise out of a mask on entry. */
export function RevealHeading(props: ComponentProps<typeof Heading>) {
  const ref = useRef<HTMLHeadingElement>(null)
  useSplitReveal(ref, { onScroll: true })
  return <Heading ref={ref} {...props} />
}
