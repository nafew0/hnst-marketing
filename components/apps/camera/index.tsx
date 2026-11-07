'use client'

import cn from 'clsx'
import { useEffect, useRef, useState } from 'react'

import { brand } from '@/brand.config'
import { Button } from '@/components/ui/button'
import { Image } from '@/components/ui/image'
import {
  notify,
  useNotifications,
} from '@/components/ui/phone/notifications/store'
import { displayFontFamily } from '@/lib/styles/fonts'

import { frameFontReady, shootFile, shootVideo } from './capture'
import { type FrameStyle, drawFrame } from './frame'
import { type ShotSheetMode, ShotSheet } from './shot-sheet'
import { type Shot, useShots } from './shots'
import { useCamera } from './use-camera'

import s from './camera.module.css'

/** The overlay's drawing size: the viewfinder's 3:4, sharp at 3× on a phone. */
const OVERLAY = { width: 1200, height: 1600 }

const MESSAGES = {
  off: 'The camera starts when you turn it on.',
  starting: 'Starting the camera…',
  on: '',
  refused:
    'Camera access is off for this site. Allow it in your browser’s settings, or choose a photo instead.',
  unavailable: 'No camera is available here. You can choose a photo instead.',
} as const

/** The gold frame over the viewfinder, drawn with the shutter's own code. */
function FrameOverlay({ frame }: { frame: FrameStyle }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { text, color, fontFamily } = frame
  useEffect(() => {
    let current = true
    const style = { text, color, fontFamily }
    void frameFontReady(style).then(() => {
      const context = canvasRef.current?.getContext('2d')
      if (!current || !context) return
      context.clearRect(0, 0, OVERLAY.width, OVERLAY.height)
      drawFrame(context, OVERLAY.width, OVERLAY.height, style)
    })
    return () => {
      current = false
    }
  }, [text, color, fontFamily])
  return (
    <canvas
      ref={canvasRef}
      width={OVERLAY.width}
      height={OVERLAY.height}
      aria-hidden="true"
      className={s.overlay}
    />
  )
}

/**
 * Camera (docs/phases/M7.md): the front camera by default, in the gold HONEST
 * frame. It starts only on a tap and stops on leaving; each photo goes to
 * Photos' Your shots, from where it can be saved, shared or posted to the
 * wall. Without a camera, the picker takes its place.
 */
export default function CameraApp() {
  const { videoRef, status, facing, start } = useCamera()
  const frameText = useNotifications((state) => state.settings.camera.frameText)
  const shots = useShots((state) => state.shots)
  const [sheet, setSheet] = useState<{
    id: string
    mode: ShotSheetMode
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const [said, setSaid] = useState('')
  const pickerRef = useRef<HTMLInputElement>(null)

  const frame: FrameStyle = {
    text: frameText,
    color: brand.palette.gold,
    fontFamily: displayFontFamily,
  }
  const last = shots[0]
  const open = sheet
    ? (shots.find((shot) => shot.id === sheet.id) ?? null)
    : null
  const live = status === 'on'
  const mirrored = facing === 'user'

  const kept = (shot: Shot, how: 'shutter' | 'picker') => {
    notify('photo-taken')
    setSaid('Photo saved to Your shots in Photos.')
    if (how === 'picker') setSheet({ id: shot.id, mode: 'actions' })
  }

  const shoot = async () => {
    const video = videoRef.current
    if (!video || !live || busy) return
    setBusy(true)
    try {
      kept(await shootVideo(video, mirrored, frame), 'shutter')
    } catch {
      setSaid('That photo didn’t work. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const choose = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      kept(await shootFile(file, frame), 'picker')
    } catch {
      setSaid('That photo can’t be opened here. Try a JPEG or PNG.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={s.camera} data-theme="dark">
      <h1 className="sr-only">Camera</h1>
      <div className={s.viewfinder}>
        <div className={s.stage}>
          <video
            ref={videoRef}
            className={cn(s.video, mirrored && s.mirrored, !live && s.hidden)}
            muted
            playsInline
            aria-label="Viewfinder"
          />
          <FrameOverlay frame={frame} />
          {!live && (
            <div className={s.prompt}>
              <p className={s.promptText}>{MESSAGES[status]}</p>
              {status !== 'unavailable' && (
                <Button
                  variant="gold"
                  disabled={status === 'starting'}
                  onClick={() => start()}
                >
                  {status === 'refused' ? 'Try again' : 'Turn on camera'}
                </Button>
              )}
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => pickerRef.current?.click()}
              >
                Choose a photo instead
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className={s.controls}>
        {last ? (
          <button
            type="button"
            className={s.lastShot}
            onClick={() => setSheet({ id: last.id, mode: 'actions' })}
          >
            <Image
              src={last.url}
              alt=""
              fill
              objectFit="cover"
              mobileSize="18vw"
              desktopSize="5vw"
            />
            <span className="sr-only">Your last photo</span>
          </button>
        ) : (
          <span className={s.lastShot} aria-hidden="true" />
        )}
        <button
          type="button"
          className={s.shutter}
          disabled={!live || busy}
          onClick={() => void shoot()}
        >
          <span className="sr-only">Take photo</span>
        </button>
        <button
          type="button"
          className={s.switch}
          disabled={!live}
          onClick={() => start(facing === 'user' ? 'environment' : 'user')}
        >
          {facing === 'user' ? 'Back camera' : 'Front camera'}
        </button>
      </div>

      <p role="status" className="sr-only">
        {said}
      </p>

      <input
        ref={pickerRef}
        type="file"
        accept="image/*"
        capture="user"
        hidden
        onChange={(event) => {
          void choose(event.currentTarget.files?.[0])
          event.currentTarget.value = ''
        }}
      />

      <ShotSheet
        shot={open}
        mode={sheet?.mode ?? 'actions'}
        onModeChange={(mode) => sheet && setSheet({ ...sheet, mode })}
        onClose={() => setSheet(null)}
      />
    </div>
  )
}
