'use client'

import { useEffect, useState } from 'react'

import type { ConsentCopy } from '@/components/forms/lead-form'
import { PackageInterestForm } from '@/components/forms/lead-form'
import type { PackageFacts } from '@/components/sections/signature/copy'
import {
  formatPrice,
  withOffers,
} from '@/components/sections/signature/package-reveal/offers'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { GroupedList, ListRow } from '@/components/ui/phone/kit/list'
import { PhoneScreen } from '@/components/ui/phone/kit/screen'
import { Sheet } from '@/components/ui/phone/kit/sheet'
import type { OffersResponse } from '@/lib/contracts'
import { api } from '@/lib/contracts/client'

import s from './packages.module.css'

export interface StoreItem {
  facts: PackageFacts
  deliverables: { title: string; description: string }[]
  revisions: string | null
  valueLabel: string | null
  legalSlug: string | null
}

interface Shared {
  toolCosts: string | null
  consent: ConsentCopy
}

/** Live offers over the CMS prices, as `/packages` does: CMS prices if it fails. */
function useOffers() {
  const [offers, setOffers] = useState<OffersResponse | null>(null)
  useEffect(() => {
    let current = true
    void api.getOffers().then((result) => {
      if (current && result.ok) setOffers(result.data)
    })
    return () => {
      current = false
    }
  }, [])
  return offers
}

function priced(items: readonly StoreItem[], offers: OffersResponse | null) {
  const facts = withOffers(
    items.map((item) => item.facts),
    offers
  )
  return items.map((item, index) => ({
    ...item,
    facts: facts[index] ?? item.facts,
  }))
}

/** A package's icon: its initial in gold on the brand's night, ours not Apple's. */
function TierIcon({
  facts,
  size,
}: {
  facts: PackageFacts
  size: 'row' | 'page'
}) {
  return (
    <span
      aria-hidden="true"
      className={size === 'page' ? s.tierIconPage : s.tierIcon}
      data-highlight={facts.highlight || undefined}
    >
      {facts.name.replace(/^the\s+/iu, '').charAt(0)}
    </span>
  )
}

/** The price, as a button: what to do next about this package. */
function PriceSheet({
  item,
  consent,
}: { item: StoreItem } & Pick<Shared, 'consent'>) {
  const { facts } = item
  const price = formatPrice(facts.price, facts.priceFrom)
  return (
    <Sheet
      title={facts.name}
      description={`${price} · ${facts.turnaround}`}
      trigger={
        <button
          type="button"
          className={s.priceButton}
          aria-label={`${price}: ${facts.name} options`}
        >
          {price}
        </button>
      }
    >
      <Button href={`/book?package=${facts.tier}`}>
        Book a call about this
      </Button>
      <section
        className={s.interest}
        aria-labelledby={`interest-${facts.tier}`}
      >
        <h3 id={`interest-${facts.tier}`} className={s.interestTitle}>
          Or tell us you’re interested
        </h3>
        <PackageInterestForm tier={facts.tier} consent={consent} />
      </section>
    </Sheet>
  )
}

export function PackageStore({
  items,
  toolCosts,
  consent,
}: { items: readonly StoreItem[] } & Shared) {
  const offers = useOffers()
  const list = priced(items, offers)
  const featured = list.find((item) => item.facts.highlight)
  return (
    <PhoneScreen title="Packages">
      {featured && (
        <Link href={featured.facts.href} className={s.feature}>
          <span className={s.featureEyebrow}>Our lead offer</span>
          <span className={s.featureName}>{featured.facts.name}</span>
          <span className={s.featureSummary}>{featured.facts.turnaround}</span>
        </Link>
      )}
      <ul className={s.list} aria-label="All packages">
        {list.map((item) => (
          <li key={item.facts.tier} className={s.row}>
            <Link href={item.facts.href} className={s.rowLink}>
              <TierIcon facts={item.facts} size="row" />
              <span className={s.rowText}>
                <span className={s.rowName}>{item.facts.name}</span>
                <span className={s.rowSummary}>{item.facts.turnaround}</span>
              </span>
            </Link>
            <PriceSheet item={item} consent={consent} />
          </li>
        ))}
      </ul>
      {toolCosts && <p className={s.note}>{toolCosts}</p>}
    </PhoneScreen>
  )
}

export function PackagePage({
  item,
  toolCosts,
  consent,
}: { item: StoreItem } & Shared) {
  const offers = useOffers()
  const [current] = priced([item], offers)
  const { facts, deliverables, revisions, valueLabel, legalSlug } =
    current ?? item
  return (
    <div className={s.page}>
      <div className={s.pageHead}>
        <TierIcon facts={facts} size="page" />
        <div className={s.pageTitle}>
          <h1 className={s.pageName}>{facts.name}</h1>
          <p className={s.pageTurnaround}>{facts.turnaround}</p>
          <PriceSheet item={current ?? item} consent={consent} />
        </div>
      </div>

      {deliverables.length > 0 && (
        <section aria-labelledby="shots">
          <h2 id="shots" className={s.sectionTitle}>
            What you get
          </h2>
          <ul className={s.shots}>
            {deliverables.map((deliverable, index) => (
              <li
                key={deliverable.title}
                className={s.shot}
                data-tone={index % 4}
              >
                <span className={s.shotNumber}>{index + 1}</span>
                <span className={s.shotTitle}>{deliverable.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <GroupedList header="What’s included">
        {deliverables.map((deliverable) => (
          <ListRow
            key={deliverable.title}
            title={deliverable.title}
            subtitle={deliverable.description}
          />
        ))}
      </GroupedList>

      <GroupedList header="Information">
        <ListRow
          title="Price"
          detail={formatPrice(facts.price, facts.priceFrom)}
        />
        {valueLabel && <ListRow title="Value" detail={valueLabel} />}
        <ListRow title="Turnaround" detail={facts.turnaround} />
        {revisions && <ListRow title="Revisions" detail={revisions} />}
        {toolCosts && <ListRow title="Tool costs" subtitle={toolCosts} />}
        {legalSlug && (
          <ListRow title="Package terms" href={`/legal/${legalSlug}`} />
        )}
        <ListRow title="Compare all packages" href="/packages" />
      </GroupedList>
    </div>
  )
}
