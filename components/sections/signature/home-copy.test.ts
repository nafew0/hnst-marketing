import { describe, expect, it } from 'bun:test'

import {
  DEFAULT_HOME_COPY,
  homeCopyFrom,
} from '@/components/sections/signature/home-copy'
import type { Homepage, Package } from '@/lib/cms/payload-types'

const founder: Package = {
  id: 3,
  tier: 'founder',
  name: 'Founder Package',
  slug: 'founder',
  price: 5500,
  turnaround: '10 days',
  order: 3,
  ctaLabel: 'See the Founder Package',
  ctaType: 'book',
  highlight: true,
  updatedAt: '2026-11-16T00:00:00.000Z',
  createdAt: '2026-11-16T00:00:00.000Z',
}

describe('the homepage words', () => {
  it('are the originals without a CMS', () => {
    const copy = homeCopyFrom({ homepage: null, packages: [], toolCosts: null })
    expect(copy.hero).toEqual(DEFAULT_HOME_COPY.hero)
    expect(copy.film).toEqual(DEFAULT_HOME_COPY.film)
    expect(copy.steps).toEqual(DEFAULT_HOME_COPY.steps)
    expect(copy.packages).toEqual(DEFAULT_HOME_COPY.packages)
    expect(copy.proof).toEqual(DEFAULT_HOME_COPY.proof)
  })

  it('show an edit, and keep the original where a field is empty', () => {
    const homepage: Homepage = {
      id: 1,
      hero: { line1: 'Your brand,', line2: '   ', lede: '' },
      turn: { closing: 'Today changed it.' },
    }
    const copy = homeCopyFrom({ homepage, packages: [], toolCosts: '  ' })
    expect(copy.hero.lines).toEqual([
      'Your brand,',
      DEFAULT_HOME_COPY.hero.lines[1] ?? '',
    ])
    expect(copy.hero.lede).toBe(DEFAULT_HOME_COPY.hero.lede)
    expect(copy.hero.primaryCta.href).toBe('/book')
    expect(copy.turn.closing).toBe('Today changed it.')
    expect(copy.packages.toolCosts).toBe(DEFAULT_HOME_COPY.packages.toolCosts)
  })

  it('keep the film’s pictures and timing, and only its three chapters', () => {
    const homepage: Homepage = {
      id: 1,
      film: {
        chapters: [
          { label: '2024', body: 'First.' },
          { label: '', body: 'Second.' },
          { label: 'Now', body: 'Third.' },
          { label: 'Extra', body: 'Ignored.' },
        ],
      },
    }
    const { chapters } = homeCopyFrom({
      homepage,
      packages: [],
      toolCosts: null,
    }).film
    expect(chapters).toHaveLength(3)
    expect(chapters[0]?.label).toBe('2024')
    expect(chapters[1]?.label).toBe(DEFAULT_HOME_COPY.film.chapters[1]?.label)
    expect(chapters[2]?.end).toBe(1)
    expect(chapters[0]?.still).toBe(DEFAULT_HOME_COPY.film.chapters[0]?.still)
  })

  it('take the CMS steps when there are any', () => {
    const homepage: Homepage = {
      id: 1,
      steps: { items: [{ title: 'Talk', description: 'We talk.' }] },
    }
    expect(
      homeCopyFrom({ homepage, packages: [], toolCosts: null }).steps.items
    ).toEqual([{ title: 'Talk', description: 'We talk.' }])
    expect(
      homeCopyFrom({
        homepage: { id: 1, steps: { items: [] } },
        packages: [],
        toolCosts: null,
      }).steps.items
    ).toEqual(DEFAULT_HOME_COPY.steps.items)
  })

  it('give a package card its CMS name, price and delivery time', () => {
    const items = homeCopyFrom({
      homepage: null,
      packages: [founder],
      toolCosts: null,
    }).packages.items
    const card = items.find((item) => item.tier === 'founder')
    expect(card?.price).toBe(5500)
    expect(card?.turnaround).toBe('10 days')
    expect(card?.ctaLabel).toBe('See the Founder Package')
    // What the CMS doesn't hold stays as designed.
    expect(card?.compare.length).toBeGreaterThan(0)
    expect(items.find((item) => item.tier === 'diamond')).toEqual(
      DEFAULT_HOME_COPY.packages.items.find((item) => item.tier === 'diamond')
    )
  })
})
