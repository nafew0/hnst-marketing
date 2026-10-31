'use client'

import { usePathname } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'

import { syncDepth } from './history'
import { leaveRoute, openRoute } from './store'

interface WindowRouteProps {
  href: string
  title: string
  children?: ReactNode
}

/**
 * Hands an intercepted page to the window layer and renders nothing here: a
 * parallel slot's content unmounts when the URL changes, and a minimised form
 * has to outlive that.
 */
export function WindowRoute({
  href,
  title,
  children = null,
}: WindowRouteProps) {
  useEffect(() => {
    syncDepth()
    openRoute({ href, title, content: children })
    return () => leaveRoute(href)
  }, [href, title, children])
  return null
}

/** Opens the window at once while its page loads. */
export function WindowLoading() {
  return <WindowRoute href={usePathname()} title="" />
}
