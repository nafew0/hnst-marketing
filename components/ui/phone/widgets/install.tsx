'use client'

import { useEffect, useState } from 'react'

import { useDeviceDetection } from '@/hooks/use-device-detection'

import { Sheet } from '../kit/sheet'
import type { PhoneSettings } from '../settings'

import s from './widgets.module.css'

/** Chrome's install prompt, which no TypeScript lib types yet. */
interface InstallPrompt extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const isInstallPrompt = (event: Event): event is InstallPrompt =>
  'prompt' in event && typeof event.prompt === 'function'

function ShareGlyph() {
  return (
    <svg
      viewBox="0 0 16 20"
      aria-hidden="true"
      focusable="false"
      className={s.shareGlyph}
    >
      <path d="M8 13V2M4 5.5 8 1.5l4 4M3 9H1.5v9.5h13V9H13" />
    </svg>
  )
}

/**
 * Add to Home Screen. Android's browsers offer their own install prompt, which
 * this opens. iPhones have no install button for websites, so it shows the
 * steps instead. Hidden once the site is running from the home screen.
 */
export function InstallWidget({ copy }: { copy: PhoneSettings['widgets'] }) {
  const { isIOS, isStandalone } = useDeviceDetection()
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  const [stepsOpen, setStepsOpen] = useState(false)

  useEffect(() => {
    const capture = (event: Event) => {
      if (!isInstallPrompt(event)) return
      // Ours to show, from the widget, not the browser's own mini bar.
      event.preventDefault()
      setPrompt(event)
    }
    const installed = () => setPrompt(null)
    window.addEventListener('beforeinstallprompt', capture)
    window.addEventListener('appinstalled', installed)
    return () => {
      window.removeEventListener('beforeinstallprompt', capture)
      window.removeEventListener('appinstalled', installed)
    }
  }, [])

  // In the server's HTML too; gone once it's known to run from the home screen.
  if (isStandalone === true) return null

  return (
    <>
      <button
        type="button"
        className={s.widget}
        data-widget="install"
        onClick={() => {
          if (!prompt) {
            setStepsOpen(true)
            return
          }
          void prompt.prompt()
          void prompt.userChoice.then(() => setPrompt(null))
        }}
      >
        <span className={s.widgetTitle}>{copy.installTitle}</span>
        <span className={s.widgetNote}>{copy.installBody}</span>
      </button>
      <Sheet
        title={copy.installTitle}
        open={stepsOpen}
        onOpenChange={setStepsOpen}
      >
        {isIOS ? (
          <ol className={s.steps}>
            <li>
              Tap <ShareGlyph /> <strong>Share</strong> in Safari’s toolbar.
            </li>
            <li>
              Choose <strong>Add to Home Screen</strong>.
            </li>
            <li>
              Tap <strong>Add</strong>.
            </li>
          </ol>
        ) : (
          <ol className={s.steps}>
            <li>Open your browser’s menu.</li>
            <li>
              Choose <strong>Install app</strong> or{' '}
              <strong>Add to Home screen</strong>.
            </li>
          </ol>
        )}
      </Sheet>
    </>
  )
}
