import type { ReactNode } from 'react'

import { Wrapper } from '@/components/layout/wrapper'

import { DirectWindow } from './direct'

import s from './window.module.css'

interface WindowPageProps {
  href: string
  title: string
  children: ReactNode
}

/** The shell of a main page at its own URL. See `docs/phases/P7W.md`. */
export function WindowPage({ href, title, children }: WindowPageProps) {
  return (
    <Wrapper lenis={false} className={s.stage}>
      <DirectWindow href={href} title={title}>
        {children}
      </DirectWindow>
    </Wrapper>
  )
}
