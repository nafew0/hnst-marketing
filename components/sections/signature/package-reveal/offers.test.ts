import { describe, expect, test } from 'bun:test'

import { homePackages } from '@/components/sections/signature/copy'

import { withOffers } from './offers'

// Failure modes: a price shown that the API no longer offers; a card losing its
// price because the API is down or skips a tier; a struck-through value kept
// from the fallback when the live offer has its own.
describe('withOffers', () => {
  test('without a response every package keeps its own facts', () => {
    expect(withOffers(homePackages, null)).toBe(homePackages)
  })

  test('live price, value and turnaround replace the fallback', () => {
    const [basic] = withOffers(homePackages, {
      packages: [
        { tier: 'basic-diy', price: 450, value: 1400, turnaround: '2 weeks' },
      ],
    })
    expect(basic).toMatchObject({
      price: 450,
      value: 1400,
      turnaround: '2 weeks',
      name: 'Basic DIY',
    })
  })

  test('a tier the API does not list keeps its fallback price', () => {
    const merged = withOffers(homePackages, {
      packages: [{ tier: 'founder', price: 4000, turnaround: '7 days' }],
    })
    expect(merged.find((item) => item.tier === 'founder')?.price).toBe(4000)
    expect(merged.find((item) => item.tier === 'executive')?.price).toBe(2500)
  })

  test('only the Founder Package is highlighted', () => {
    expect(
      homePackages.filter((item) => item.highlight).map((item) => item.tier)
    ).toEqual(['founder'])
  })
})
