'use client'
import { useEffect, useRef, useState } from 'react'

import { getChallenge } from '@/components/forms/challenge'
export function Captcha() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_API_MOCKS === '1') return
    let active = true
    let element: HTMLElement | undefined
    async function setup() {
      await import('altcha')
      const challenge = await getChallenge()
      if (!active || !hostRef.current) return
      if (!challenge) {
        setFailed(true)
        return
      }
      const widget = document.createElement('altcha-widget')
      element = widget
      widget.setAttribute('name', 'altcha')
      widget.setAttribute('configuration', JSON.stringify({ challenge }))
      hostRef.current.append(widget)
    }
    void setup().catch(() => {
      if (active) setFailed(true)
    })
    return () => {
      active = false
      element?.remove()
    }
  }, [])
  if (process.env.NEXT_PUBLIC_API_MOCKS === '1')
    return (
      <>
        <input type="hidden" name="altcha" value="mock-altcha-payload" />
        <p className="caption text-silver">
          Local demo: submissions use a simulated API.
        </p>
      </>
    )
  return (
    <div ref={hostRef}>
      {failed && (
        <p role="alert">Verification is unavailable. Please try again later.</p>
      )}
    </div>
  )
}
