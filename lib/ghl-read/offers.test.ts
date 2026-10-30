import { describe, expect, it } from 'bun:test'

import {
  OFFERS_CACHE_TAG,
  OFFERS_REVALIDATE_SECONDS,
} from '@/lib/ghl/constants'
import type {
  AppointmentRequest,
  ContactRequest,
  CustomValue,
  FreeSlotQuery,
  GhlClient,
  IntentWrite,
  OpportunityRequest,
} from '@/lib/ghl/types'

import {
  loadOffers,
  mapOffers,
  OffersUnavailable,
  wholeDollars,
} from './offers'

function value(key: string, text: string): CustomValue {
  return { id: key, key, name: key, value: text }
}

describe('offers', () => {
  it('maps custom values, including the braced GHL key', () => {
    const mapped = mapOffers([
      value('{{ custom_values.price_basic }}', '$500'),
      value('value_basic', '1500'),
      value('turnaround_basic', 'Self-paced'),
      value('price_founder', '$5,000'),
      value('value_founder', '15000'),
      value('turnaround_founder', '7–14 days'),
      value('public_phone', '+12025550123'),
      value('offer_banner', 'Founder Package'),
    ])
    expect(mapped.packages.map((item) => item.tier)).toEqual([
      'basic-diy',
      'founder',
    ])
    expect(mapped.packages[1]).toEqual({
      tier: 'founder',
      price: 5000,
      value: 15000,
      turnaround: '7–14 days',
    })
    expect(mapped.phone).toBe('+12025550123')
    expect(mapped.banner).toBe('Founder Package')
    expect(wholeDollars('nope')).toBeNull()
  })

  it('reads products and fails closed when no price is set', async () => {
    let products = 0
    const ghl: GhlClient = {
      async upsertContact(_input: ContactRequest) {
        return { contactId: 'c' }
      },
      async addNote() {
        return { noteId: 'n' }
      },
      async addTags() {
        await Promise.resolve()
      },
      async upsertOpportunity(_input: OpportunityRequest) {
        return { opportunityId: 'o' }
      },
      async getFreeSlots(_input: FreeSlotQuery) {
        return {}
      },
      async createAppointment(_input: AppointmentRequest) {
        return { appointmentId: 'a', start: 's', end: 'e' }
      },
      async getCustomValues() {
        return []
      },
      async listProducts() {
        products += 1
        return [{ id: 'product-1', name: 'Founder' }]
      },
      async applyIntent(_input: IntentWrite) {
        return 'missing'
      },
    }
    await expect(loadOffers(ghl)).rejects.toBeInstanceOf(OffersUnavailable)
    expect(products).toBe(1)
  })

  it('caches offers for ten minutes under the offers tag', () => {
    expect(OFFERS_REVALIDATE_SECONDS).toBe(600)
    expect(OFFERS_CACHE_TAG).toBe('offers')
  })
})
