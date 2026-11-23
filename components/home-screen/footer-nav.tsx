'use client'

import { createContext, type ReactNode, use } from 'react'

export interface FooterNavItem {
  href: string
  label: string
}

const HomeScreenNavContext = createContext<readonly FooterNavItem[] | null>(
  null
)

/**
 * While the home screen is on, the footer lists its pages (the widgets and
 * app icons, from the CMS) instead of the old site's. Null when it is off.
 */
export function HomeScreenNavProvider({
  items,
  children,
}: {
  items: readonly FooterNavItem[] | null
  children: ReactNode
}) {
  return <HomeScreenNavContext value={items}>{children}</HomeScreenNavContext>
}

export function useHomeScreenNav() {
  return use(HomeScreenNavContext)
}
