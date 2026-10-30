'use client'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import * as CookieConsent from 'vanilla-cookieconsent'

import 'vanilla-cookieconsent/dist/cookieconsent.css'
import { captureAttribution } from '@/components/forms/attribution'
import { flushEvents, setTrackingConsent, track } from '@/lib/track'
let trackingScript: HTMLScriptElement | undefined
export function PrivacyControls({ trackingId = '' }: { trackingId?: string }) {
  const pathname = usePathname()
  useEffect(() => {
    captureAttribution()
  }, [])
  useEffect(() => {
    let active = true
    const sync = () => {
      if (!active) return
      const accepted = CookieConsent.acceptedCategory('analytics')
      setTrackingConsent(accepted)
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
    window.addEventListener('hnst:consent', sync)
    void CookieConsent.run({
      hideFromBots: false,
      categories: {
        necessary: { enabled: true, readOnly: true },
        analytics: {},
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
      window.removeEventListener('hnst:consent', sync)
    }
  }, [trackingId])
  useEffect(() => {
    if (pathname === '/packages' || pathname.startsWith('/packages/'))
      track('pricing_viewed', { path: pathname })
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
      onClick={() => CookieConsent.showPreferences()}
      className="fixed right-[12px] bottom-[12px] z-50 rounded-full border border-gold/40 bg-void dr-px-16 dr-py-8 caption text-starlight"
    >
      Privacy choices
    </button>
  )
}
