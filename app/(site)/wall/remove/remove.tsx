'use client'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { PhoneScreen } from '@/components/ui/phone/kit/screen'
import { ErrorState, LoadingState } from '@/components/ui/phone/kit/states'
import { api } from '@/lib/contracts/client'
import {
  wallRemoveInputSchema,
  type WallRemoveInput,
} from '@/lib/contracts/wall'

export function WallRemoval() {
  const [input, setInput] = useState<WallRemoveInput | null>(null)
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState(false)
  const [removed, setRemoved] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  useEffect(() => {
    function readFragment() {
      const [id, token, extra] = window.location.hash.slice(1).split('.')
      const parsed = wallRemoveInputSchema.safeParse({ id, token })
      setInput(parsed.success && extra === undefined ? parsed.data : null)
      setReady(true)
    }
    readFragment()
    window.addEventListener('hashchange', readFragment)
    return () => window.removeEventListener('hashchange', readFragment)
  }, [])
  async function remove() {
    if (!input || inFlight.current) return
    inFlight.current = true
    setPending(true)
    setError('')
    try {
      const result = await api.removeWallPhoto(input)
      if (result.ok) {
        setRemoved(true)
        setInput(null)
        history.replaceState(null, '', location.pathname)
      } else
        setError(
          result.status === 404
            ? 'This removal link is invalid or the photo is no longer available.'
            : 'We could not remove the photo. Please try again.'
        )
    } finally {
      inFlight.current = false
      setPending(false)
    }
  }
  let content
  if (!ready) content = <LoadingState />
  else if (removed) content = <p role="status">Your photo has been removed.</p>
  else if (!input)
    content = (
      <ErrorState title="Invalid removal link">
        Open the complete private link supplied when you posted.
      </ErrorState>
    )
  else
    content = (
      <div className="flex flex-col gap-[24px]">
        <p>Remove this photo from the HONEST wall? This cannot be undone.</p>
        <Button
          disabled={pending}
          onClick={() => {
            void remove()
          }}
        >
          {pending ? 'Removing…' : 'Remove my photo'}
        </Button>
        {error && <ErrorState title={error} />}
      </div>
    )
  return <PhoneScreen title="Remove your wall photo">{content}</PhoneScreen>
}
