import { Wrapper } from '@/components/layout/wrapper'
import { homeCopyFrom } from '@/components/sections/signature/home-copy'
import { HomeSections } from '@/components/sections/signature/home-sections'
import { PHONE_LAYOUT } from '@/components/ui/phone/flag'
import { PhoneHome } from '@/components/ui/phone/home'
import { loadPhoneContent } from '@/components/ui/phone/load'
import { getPublishedHome } from '@/lib/cms/data'

export default async function Home() {
  const cms = await getPublishedHome()
  const copy = homeCopyFrom({
    homepage: cms?.homepage ?? null,
    packages: cms?.packages ?? [],
    toolCosts: cms?.toolCosts,
  })
  return (
    <Wrapper theme="dark" lenis={{}} safariEdges>
      {PHONE_LAYOUT && (
        <>
          {/* Without JavaScript the home screen can't work: the story reads as before. */}
          <noscript>
            <style>{'[data-phone-home]{display:none!important}'}</style>
          </noscript>
          <PhoneHome content={await loadPhoneContent()} />
        </>
      )}
      <HomeSections copy={copy} />
    </Wrapper>
  )
}
