'use client'

import cn from 'clsx'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { worldHost, WorldSky } from '@/components/world'

import { TitleBar } from './controls'
import { captureDraft } from './drafts'
import { setMinimised } from './store'

import s from './window.module.css'

interface DirectWindowProps {
  href: string
  title: string
  children: ReactNode
}

/**
 * A direct visit, refresh or crawler: the complete server-rendered page in the
 * window frame. Green fills the browser window with the frame, so the header
 * and footer behind it go inert.
 */
export function DirectWindow({ href, title, children }: DirectWindowProps) {
  const [fullscreen, setFullscreen] = useState(false)
  const frameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!fullscreen) return
    const behind = document.querySelectorAll('header, footer')
    const root = document.documentElement
    for (const element of behind) element.setAttribute('inert', '')
    root.style.overflow = 'hidden'
    return () => {
      for (const element of behind) element.removeAttribute('inert')
      root.style.overflow = ''
    }
  }, [fullscreen])

  return (
    <div
      ref={frameRef}
      className={cn(s.direct, worldHost)}
      data-theme="dark"
      data-window-direct
      data-fullscreen={fullscreen || undefined}
    >
      <TitleBar
        home
        title={title}
        fullscreen={fullscreen}
        onToggleFullscreen={() => setFullscreen((value) => !value)}
        onMinimise={() => {
          if (!frameRef.current) return
          setMinimised({
            href,
            title,
            draft: captureDraft(frameRef.current),
          })
        }}
      />
      <WorldSky />
      {children}
    </div>
  )
}
