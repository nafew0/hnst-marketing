import { Wrapper } from '@/components/layout/wrapper'
import { Hero } from '@/components/sections/signature/hero'
import { Manifesto } from '@/components/sections/signature/manifesto'

export default function Home() {
  return (
    <Wrapper theme="dark" lenis={{}} safariEdges>
      <Hero />
      <Manifesto />
    </Wrapper>
  )
}
