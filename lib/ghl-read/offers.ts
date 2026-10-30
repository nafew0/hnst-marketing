import pino from 'pino'

import type { OffersResponse, Tier } from '@/lib/contracts'
import type { CustomValue, GhlClient } from '@/lib/ghl/types'

const logger = pino({ level: 'info' })

const moneyPattern = /^(\d+)(?:\.\d+)?$/u

const TIER_KEYS: { tier: Tier; keys: string[] }[] = [
  { tier: 'basic-diy', keys: ['basic', 'basic_diy', 'basic-diy'] },
  { tier: 'executive', keys: ['executive'] },
  { tier: 'founder', keys: ['founder'] },
  { tier: 'diamond', keys: ['diamond'] },
]

export class OffersUnavailable extends Error {
  constructor() {
    super('GoHighLevel returned no package prices')
    this.name = 'OffersUnavailable'
  }
}

/** `{{ custom_values.price_founder }}` and `price_founder` both become `price_founder`. */
export function normalizeValueKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replaceAll('{{', '')
    .replaceAll('}}', '')
    .replaceAll(' ', '')
    .replace(/^custom_values\./u, '')
}

export function wholeDollars(raw: string): number | null {
  const cleaned = raw.replaceAll('$', '').replaceAll(',', '').trim()
  if (!moneyPattern.test(cleaned)) return null
  const rounded = Math.round(Number(cleaned))
  if (!Number.isFinite(rounded) || rounded < 0) return null
  return rounded
}

function indexValues(values: CustomValue[]): Map<string, string> {
  const indexed = new Map<string, string>()
  for (const value of values) {
    const text = value.value.trim()
    if (text === '') continue
    indexed.set(normalizeValueKey(value.key), text)
    indexed.set(normalizeValueKey(value.name), text)
  }
  return indexed
}

function lookup(indexed: Map<string, string>, names: string[]): string | null {
  for (const name of names) {
    const found = indexed.get(name)
    if (found) return found
  }
  return null
}

/**
 * Package prices come from custom values (`price_founder` and the rest).
 * Products are read by the caller so a catalog outage fails the request;
 * the contract has no product fields.
 */
export function mapOffers(values: CustomValue[]): OffersResponse {
  const indexed = indexValues(values)
  const packages: OffersResponse['packages'] = []
  for (const entry of TIER_KEYS) {
    const priceNames = entry.keys.map((key) => `price_${key}`)
    const valueNames = entry.keys.map((key) => `value_${key}`)
    const turnaroundNames = entry.keys.map((key) => `turnaround_${key}`)
    const price = wholeDollars(lookup(indexed, priceNames) ?? '')
    const turnaround = lookup(indexed, turnaroundNames)
    if (price === null || !turnaround) continue
    const stated = wholeDollars(lookup(indexed, valueNames) ?? '')
    const item = {
      tier: entry.tier,
      price,
      turnaround: turnaround.slice(0, 80),
    }
    packages.push(stated === null ? item : { ...item, value: stated })
  }

  const response: OffersResponse = { packages }
  const phone = lookup(indexed, ['public_phone'])
  const banner = lookup(indexed, ['offer_banner'])
  if (phone) response.phone = phone.slice(0, 40)
  if (banner) response.banner = banner.slice(0, 200)
  return response
}

export async function loadOffers(ghl: GhlClient): Promise<OffersResponse> {
  const values = await ghl.getCustomValues()
  const products = await ghl.listProducts()
  const mapped = mapOffers(values)
  logger.info(
    { products: products.length, packages: mapped.packages.length },
    'offers read'
  )
  if (mapped.packages.length === 0) throw new OffersUnavailable()
  return mapped
}
