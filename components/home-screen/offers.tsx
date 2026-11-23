import { RevealHeading } from '@/components/sections/signature/reveal-heading'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/heading'
import type { SiteContact } from '@/components/ui/phone/registry'

import { contactLink } from './contact'
import type { HomeScreenCopy } from './copy'

import s from '@/components/sections/signature/packages/packages.module.css'

/**
 * S6 on the cinematic homepage while the home screen is on: the three offers,
 * with no prices (21 Nov 2026), each with Explore and Get a Price.
 */
export function HomeOffers({
  copy,
  bar,
  contact,
}: {
  copy: HomeScreenCopy['offers']
  bar: HomeScreenCopy['bar']
  contact: SiteContact
}) {
  return (
    <section className={s.section} aria-labelledby="offers-title">
      <div className="dr-layout-block flex flex-col dr-gap-32">
        <div className={s.intro}>
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <RevealHeading id="offers-title">{copy.heading}</RevealHeading>
          <p className="max-w-[64ch] p text-pretty text-silver">{copy.body}</p>
        </div>
        <ul className="grid dr-gap-16 dt:grid-cols-3">
          {copy.items.map((offer) => (
            <li
              key={offer.href}
              className="flex flex-col dr-gap-16 rounded-[16px] border border-gold/30 bg-void-2/80 dr-p-24"
            >
              {offer.badge && (
                <p className="self-start rounded-[999px] bg-gold dr-px-12 dr-py-4 caption font-[700] text-void uppercase">
                  {offer.badge}
                </p>
              )}
              <h3 className="h3 text-balance">{offer.title}</h3>
              <p className="flex-1 p text-pretty text-silver">{offer.line}</p>
              <div className="flex flex-wrap dr-gap-8">
                <Button href={offer.href} variant="ghost">
                  {copy.exploreLabel}
                </Button>
                <Button href={contactLink('price', offer.title, contact, bar)}>
                  {copy.priceLabel}
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <p className="max-w-[72ch] caption text-silver">{copy.terms}</p>
      </div>
    </section>
  )
}
