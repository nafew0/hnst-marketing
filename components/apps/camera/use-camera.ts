'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { APP_PARAM } from '@/components/ui/phone/registry'
import { useWindows } from '@/components/ui/window/store'

export type Facing = 'user' | 'environment'
export type CameraStatus = 'off' | 'starting' | 'on' | 'refused' | 'unavailable'

const CAMERA_QUERY = `${APP_PARAM}=camera`

/** The window on top is Camera. */
export function isCameraHref(href: string | null | undefined) {
  return href?.includes(CAMERA_QUERY) === true
}

function release(stream: MediaStream | null) {
  for (const track of stream?.getTracks() ?? []) track.stop()
}

/**
 * The camera's stream. Nothing starts until `start()`, which only a tap calls
 * (docs/phases/PHONE.md § 3). The tracks stop when Camera stops being the
 * window on top (going home, another app), when the tab is hidden, and when
 * the app closes; a tap starts it again.
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  /** Bumped by every start and stop, so a start that resolves late is dropped. */
  const attemptRef = useRef(0)
  const [status, setStatus] = useState<CameraStatus>('off')
  const [facing, setFacing] = useState<Facing>('user')

  const stop = () => {
    attemptRef.current += 1
    release(streamRef.current)
    streamRef.current = null
    const video = videoRef.current
    if (video) video.srcObject = null
    setStatus((current) =>
      current === 'on' || current === 'starting' ? 'off' : current
    )
  }

  const start = async (next: Facing = facing) => {
    release(streamRef.current)
    streamRef.current = null
    attemptRef.current += 1
    const attempt = attemptRef.current
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable')
      return
    }
    setStatus('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: next,
          width: { ideal: 1920 },
          height: { ideal: 1440 },
        },
      })
      if (attempt !== attemptRef.current) {
        release(stream)
        return
      }
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play().catch(() => undefined)
      }
      setFacing(next)
      setStatus('on')
    } catch (error) {
      if (attempt !== attemptRef.current) return
      const name = error instanceof DOMException ? error.name : ''
      setStatus(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'refused'
          : 'unavailable'
      )
    }
  }

  const onLeave = useEffectEvent(stop)

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') onLeave()
    }
    document.addEventListener('visibilitychange', onVisibility)
    const unsubscribe = useWindows.subscribe((state, previous) => {
      if (isCameraHref(previous.activeHref) && !isCameraHref(state.activeHref))
        onLeave()
    })
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      unsubscribe()
      attemptRef.current += 1
      release(streamRef.current)
      streamRef.current = null
    }
  }, [])

  return {
    videoRef,
    status,
    facing,
    start: (next?: Facing) => void start(next),
    stop,
  }
}
