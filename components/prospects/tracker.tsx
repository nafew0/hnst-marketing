'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import * as CookieConsent from 'vanilla-cookieconsent'

import { useDeviceDetection } from '@/hooks/use-device-detection'

import { recordProspectVisit } from './actions'
import { setProspectName } from './store'
import { PROSPECT_PARAM, TOKEN_PATTERN } from './token'

/**
 * A prospect's tagged link (`?p=…`, Admin → Prospects): logs that it was
 * opened, greets them by name, and takes the tag out of the address bar so a
 * forwarded screenshot or copied link doesn't carry it. Later pages in the
 * same visit are logged only with analytics consent. The tag stays in memory;
 * no cookie or storage.
 */
export function ProspectTracker() {
  const pathname = usePathname()
  const { isMobile } = useDeviceDetection()
  const tokenRef = useRef<string | null>(null)
  const lastRef = useRef<string | null>(null)

  useEffect(() => {
    if (isMobile === undefined) return
    const device = isMobile ? 'phone' : 'computer'

    if (tokenRef.current === null) {
      const url = new URL(window.location.href)
      const token = url.searchParams.get(PROSPECT_PARAM)
      if (!token || !TOKEN_PATTERN.test(token)) {
        tokenRef.current = ''
        return
      }
      tokenRef.current = token
      lastRef.current = pathname
      url.searchParams.delete(PROSPECT_PARAM)
      window.history.replaceState(
        window.history.state,
        '',
        `${url.pathname}${url.search}${url.hash}`
      )
      void recordProspectVisit({
        token,
        kind: 'opened',
        path: pathname,
        device,
      }).then((result) => setProspectName(result.name))
      return
    }

    const token = tokenRef.current
    if (!token || lastRef.current === pathname) return
    lastRef.current = pathname
    if (!CookieConsent.acceptedCategory('analytics')) return
    void recordProspectVisit({ token, kind: 'page', path: pathname, device })
  }, [pathname, isMobile])

  return null
}
