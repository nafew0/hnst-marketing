'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import * as CookieConsent from 'vanilla-cookieconsent'

import 'vanilla-cookieconsent/dist/cookieconsent.css'
import './privacy.css'
import { captureAttribution } from '@/components/forms/attribution'
import { getTrackingId } from '@/components/forms/tracking-settings'
import { tierSchema } from '@/lib/contracts'
import { flushEvents, setTrackingConsent, track } from '@/lib/track'
let trackingScript: HTMLScriptElement | undefined
export function openPrivacyPreferences() {
  CookieConsent.showPreferences()
}
const trackingKeys =
  /^(?:_landing-page|v2_(?:session_history|contact_session|history)|v3_first_session_event|_ga|_gid|_gcl|_gat|hl_|ghl_|leadconnector)/u
function clearAnalyticsStorage() {
  try {
    for (const storage of [localStorage, sessionStorage]) {
      for (const key of Object.keys(storage))
        if (trackingKeys.test(key)) storage.removeItem(key)
    }
  } catch {
    /* Storage may be disabled by the browser. */
  }
}
export function PrivacyControls() {
  const pathname = usePathname()
  const viewedRef = useRef<string | null>(null)
  useEffect(() => {
    captureAttribution()
    function recordClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return
      const link = event.target.closest<HTMLAnchorElement>('a[href]')
      if (!link) return
      const path = new URL(link.href, window.location.href).pathname
      const tier = tierSchema.safeParse(path.split('/')[2])
      if (path.startsWith('/packages/') && tier.success)
        track('package_clicked', { tier: tier.data })
      if (
        ['/book', '/contact', '/packages', '/the-honest-marketer'].includes(
          path
        ) ||
        (path.startsWith('/packages/') && tier.success)
      )
        track('cta_clicked', { href: path })
    }
    document.addEventListener('click', recordClick)
    return () => document.removeEventListener('click', recordClick)
  }, [])
  useEffect(() => {
    let active = true
    const sync = async () => {
      if (!active) return
      const accepted = CookieConsent.acceptedCategory('analytics')
      setTrackingConsent(accepted)
      if (!accepted) clearAnalyticsStorage()
      if (
        accepted &&
        (pathname === '/packages' || pathname.startsWith('/packages/')) &&
        viewedRef.current !== pathname
      ) {
        viewedRef.current = pathname
        track('pricing_viewed', { path: pathname })
      }
      const trackingId = accepted ? await getTrackingId() : ''
      if (!active || accepted !== CookieConsent.acceptedCategory('analytics'))
        return
      if (
        accepted &&
        trackingId &&
        process.env.NEXT_PUBLIC_API_MOCKS !== '1' &&
        !trackingScript
      ) {
        trackingScript = document.createElement('script')
        trackingScript.src = 'https://link.msgsndr.com/js/external-tracking.js'
        trackingScript.dataset.trackingId = trackingId
        trackingScript.async = true
        document.head.append(trackingScript)
      } else if (!accepted && trackingScript) {
        trackingScript.remove()
        // Reload destroys tracker listeners after the updated preference is saved.
        window.location.reload()
      }
    }
    const changed = () => {
      void sync()
    }
    window.addEventListener('hnst:consent', changed)
    void CookieConsent.run({
      hideFromBots: true,
      categories: {
        necessary: { enabled: true, readOnly: true },
        analytics: { autoClear: { cookies: [{ name: trackingKeys }] } },
      },
      onConsent: () => window.dispatchEvent(new Event('hnst:consent')),
      onChange: () => window.dispatchEvent(new Event('hnst:consent')),
      language: {
        default: 'en',
        translations: {
          en: {
            consentModal: {
              title: 'Your privacy, your choice.',
              description:
                'Necessary storage keeps the site working. With your permission, analytics helps us understand which pages are useful.',
              acceptAllBtn: 'Accept all',
              acceptNecessaryBtn: 'Necessary only',
              showPreferencesBtn: 'Choose preferences',
            },
            preferencesModal: {
              title: 'Privacy preferences',
              acceptAllBtn: 'Accept all',
              acceptNecessaryBtn: 'Necessary only',
              savePreferencesBtn: 'Save preferences',
              closeIconLabel: 'Close',
              sections: [
                {
                  title: 'Necessary',
                  description:
                    'Required for your preferences and site features.',
                  linkedCategory: 'necessary',
                },
                {
                  title: 'Analytics',
                  description:
                    'Optional measurement of page views and interactions.',
                  linkedCategory: 'analytics',
                },
              ],
            },
          },
        },
      },
    }).then(sync)
    const interval = setInterval(() => {
      void flushEvents()
    }, 10000)
    const hide = () => {
      void flushEvents(true)
    }
    window.addEventListener('pagehide', hide)
    return () => {
      active = false
      clearInterval(interval)
      window.removeEventListener('pagehide', hide)
      window.removeEventListener('hnst:consent', changed)
    }
  }, [pathname])
  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      const link = event.target.closest('a')
      const href = link?.getAttribute('href')
      if (href?.startsWith('/packages/'))
        track('package_clicked', { path: href })
      else if (href === '/contact' || href === '/book')
        track('cta_clicked', { path: href })
    }
    document.addEventListener('click', click)
    return () => document.removeEventListener('click', click)
  }, [])
  return (
    <button
      type="button"
      onClick={openPrivacyPreferences}
      className="fixed right-[12px] bottom-[12px] z-50 rounded-full border border-gold/40 bg-void dr-px-16 dr-py-8 caption text-starlight"
    >
      Privacy choices
    </button>
  )
}
