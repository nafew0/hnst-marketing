import { contactLink } from '@/components/home-screen/contact'
import { HomeOffers } from '@/components/home-screen/offers'
import { HomeScreen } from '@/components/home-screen/screen'
import { Wrapper } from '@/components/layout/wrapper'
import {
  type HomeCopy,
  homeCopyFrom,
} from '@/components/sections/signature/home-copy'
import { HomeSections } from '@/components/sections/signature/home-sections'
import { PHONE_LAYOUT } from '@/components/ui/phone/flag'
import { PhoneHome } from '@/components/ui/phone/home'
import { loadPhoneContent } from '@/components/ui/phone/load'
import { getPublishedHome, getPublishedHomeScreen } from '@/lib/cms/data'

/**
 * While the home screen is on there is no booking and no package page: the
 * homepage's calls to book go to the phone, and its package links to Offers.
 */
function withoutBooking(copy: HomeCopy, call: string): HomeCopy {
  const href = (value: string) => {
    if (value === '/book') return call
    if (value.startsWith('/packages')) return '/offers'
    return value
  }
  return {
    ...copy,
    hero: {
      ...copy.hero,
      primaryCta: {
        ...copy.hero.primaryCta,
        href: href(copy.hero.primaryCta.href),
      },
      secondaryCta: {
        ...copy.hero.secondaryCta,
        href: href(copy.hero.secondaryCta.href),
      },
    },
    proof: {
      ...copy.proof,
      cta: { ...copy.proof.cta, href: href(copy.proof.cta.href) },
    },
  }
}

export default async function Home() {
  const [cms, { screen }, phone] = await Promise.all([
    getPublishedHome(),
    getPublishedHomeScreen(),
    loadPhoneContent(),
  ])
  const copy = homeCopyFrom({
    homepage: cms?.homepage ?? null,
    packages: cms?.packages ?? [],
    toolCosts: cms?.toolCosts,
  })

  if (screen.enabled)
    return (
      <Wrapper theme="dark" lenis={{}} safariEdges>
        <HomeScreen copy={screen} />
        <HomeSections
          copy={withoutBooking(
            copy,
            contactLink('call', 'home', phone.contact, screen.bar)
          )}
          offers={
            <HomeOffers
              copy={screen.offers}
              bar={screen.bar}
              contact={phone.contact}
            />
          }
        />
      </Wrapper>
    )

  return (
    <Wrapper theme="dark" lenis={{}} safariEdges>
      {PHONE_LAYOUT && (
        <>
          {/* Without JavaScript the home screen can't work: the story reads as before. */}
          <noscript>
            <style>{'[data-phone-home]{display:none!important}'}</style>
          </noscript>
          <PhoneHome content={phone} />
        </>
      )}
      <HomeSections copy={copy} />
    </Wrapper>
  )
}
