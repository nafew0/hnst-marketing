'use client'

import { Dialog } from '@base-ui/react/dialog'
import { type PointerEvent, useRef, useState } from 'react'

import { useShots } from '@/components/apps/camera/shots'
import { useDeviceTier } from '@/components/motion/device-tier'
import { Button } from '@/components/ui/button'
import { Image } from '@/components/ui/image'
import { PhoneScreen } from '@/components/ui/phone/kit/screen'
import { Segmented } from '@/components/ui/phone/kit/segmented'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/ui/phone/kit/states'
import { CLIP_FOCUS, type WorldClip } from '@/components/world/worlds'
import type { WallPhoto } from '@/lib/contracts'
import { api } from '@/lib/contracts/client'

import type { PhoneImage } from '../shared/cms'

import s from './photos.module.css'

export interface ProofPhoto {
  id: string
  title: string
  caption: string
  placeholder: string
  image: PhoneImage | null
}

interface Research {
  title: string
  body: string
  attribution: string
}

const ALBUMS = [
  { value: 'proof', label: 'Proof' },
  { value: 'wall', label: 'Wall' },
  { value: 'worlds', label: 'Worlds' },
  { value: 'shots', label: 'Your shots' },
] as const
type Album = (typeof ALBUMS)[number]['value']

/** One thing the viewer can show. */
interface Viewable {
  id: string
  title: string
  caption?: string
  image?: PhoneImage
  /** A world's loop: its poster is `image`. */
  loop?: { src: string; focus: string }
  /**
   * Set for wall photos, which can be reported. They skip the image
   * optimizer, which would cache a copy for 30 days (`minimumCacheTTL`) and
   * keep serving it after moderation hides or removes the photo. The file is
   * already a WebP of at most 1600 px, served `no-store`.
   */
  wallId?: string
}

// SAFETY: CLIP_FOCUS `satisfies Record<WorldClip, string>`, so its keys are the clips.
const WORLDS = Object.keys(CLIP_FOCUS) as WorldClip[]

const worldTitle = (clip: string) =>
  clip.replaceAll('-', ' ').replace(/^\w/u, (first) => first.toUpperCase())

const worldItems: Viewable[] = WORLDS.map((clip) => ({
  id: clip,
  title: worldTitle(clip),
  image: {
    src: `/worlds/${clip}.webp`,
    alt: `${worldTitle(clip)}, from the brand's worlds`,
    width: 1600,
    height: 900,
  },
  loop: { src: `/worlds/${clip}-m.mp4`, focus: CLIP_FOCUS[clip] },
}))

type ReportState = 'sending' | 'done' | 'gone' | 'limited' | 'failed'

const REPORT_MESSAGES = {
  done: 'Reported. An editor will look at it.',
  gone: 'This photo is no longer on the wall.',
  limited: 'Too many reports from here. Try again later.',
  failed: 'Couldn’t send the report. Try again.',
} as const satisfies Record<Exclude<ReportState, 'sending'>, string>

/** A swipe sideways this far changes photo, in px. */
const SWIPE = 50

/** The photo, a world's loop where motion is allowed, or the caption when there's no image. */
function ViewerMedia({ item, motion }: { item: Viewable; motion: boolean }) {
  if (item.loop && motion)
    return (
      <video
        key={item.id}
        className={s.viewerVideo}
        style={{ objectPosition: item.loop.focus }}
        poster={item.image?.src}
        muted
        loop
        playsInline
        autoPlay
        aria-label={item.image?.alt ?? item.title}
      >
        <source src={item.loop.src} type="video/mp4" />
      </video>
    )
  if (item.image)
    return (
      <Image
        key={item.id}
        src={item.image.src}
        alt={item.image.alt}
        width={item.image.width}
        height={item.image.height}
        mobileSize="100vw"
        desktopSize="60vw"
        unoptimized={item.wallId !== undefined}
        className={s.viewerImage}
      />
    )
  return <p className={s.viewerPlaceholder}>{item.caption}</p>
}

function Viewer({
  items,
  index,
  onIndex,
}: {
  items: readonly Viewable[]
  index: number | null
  onIndex: (index: number | null) => void
}) {
  const { state: device } = useDeviceTier()
  const [reports, setReports] = useState<Record<string, ReportState>>({})
  const startX = useRef<number | null>(null)
  const item = index === null ? undefined : items[index]
  const count = items.length
  const go = (step: number) => {
    if (index === null || count === 0) return
    onIndex((index + step + count) % count)
  }

  const report = (id: string) => {
    setReports((current) => ({ ...current, [id]: 'sending' }))
    void api.reportWallPhoto({ id }).then((result) => {
      let next: ReportState = 'failed'
      if (result.ok) next = 'done'
      else if (result.status === 404) next = 'gone'
      else if (result.status === 429) next = 'limited'
      setReports((current) => ({ ...current, [id]: next }))
    })
  }

  const onPointerDown = (event: PointerEvent) => {
    startX.current = event.clientX
  }
  const onPointerUp = (event: PointerEvent) => {
    if (startX.current === null) return
    const travelled = event.clientX - startX.current
    startX.current = null
    if (Math.abs(travelled) > SWIPE) go(travelled < 0 ? 1 : -1)
  }

  const reportState = item?.wallId ? reports[item.wallId] : undefined

  return (
    <Dialog.Root
      open={item !== undefined}
      onOpenChange={(open) => {
        if (!open) onIndex(null)
      }}
    >
      <Dialog.Portal>
        <Dialog.Popup
          className={s.viewer}
          data-theme="dark"
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') go(1)
            if (event.key === 'ArrowLeft') go(-1)
          }}
        >
          {item && (
            <>
              <div className={s.viewerBar}>
                <Dialog.Close className={s.viewerButton}>Close</Dialog.Close>
                <span className={s.viewerCount}>
                  {(index ?? 0) + 1} of {count}
                </span>
              </div>
              <div
                className={s.viewerMedia}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerCancel={() => {
                  startX.current = null
                }}
              >
                <ViewerMedia
                  item={item}
                  motion={device?.motionMedia === true}
                />
              </div>
              <div className={s.viewerFoot}>
                <Dialog.Title className={s.viewerTitle}>
                  {item.title}
                </Dialog.Title>
                {item.caption && (
                  <Dialog.Description className={s.viewerCaption}>
                    {item.caption}
                  </Dialog.Description>
                )}
                <div className={s.viewerControls}>
                  <button
                    type="button"
                    className={s.viewerButton}
                    onClick={() => go(-1)}
                    disabled={count < 2}
                  >
                    Previous
                  </button>
                  {item.wallId &&
                    (reportState && reportState !== 'sending' ? (
                      <p role="status" className={s.viewerStatus}>
                        {REPORT_MESSAGES[reportState]}
                      </p>
                    ) : (
                      <button
                        type="button"
                        className={s.viewerButton}
                        disabled={reportState === 'sending'}
                        onClick={() => item.wallId && report(item.wallId)}
                      >
                        Report
                      </button>
                    ))}
                  <button
                    type="button"
                    className={s.viewerButton}
                    onClick={() => go(1)}
                    disabled={count < 2}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Square thumbnails, three across, that open the viewer. */
function Grid({
  label,
  items,
  onOpen,
}: {
  label: string
  items: readonly Viewable[]
  onOpen: (index: number) => void
}) {
  return (
    <ul className={s.grid} aria-label={label}>
      {items.map((item, index) => (
        <li key={item.id}>
          <button
            type="button"
            className={s.thumb}
            onClick={() => onOpen(index)}
          >
            {item.image ? (
              <Image
                src={item.image.src}
                alt={item.image.alt}
                fill
                mobileSize="34vw"
                desktopSize="10vw"
                objectFit="cover"
                unoptimized={item.wallId !== undefined}
              />
            ) : (
              <span className={s.thumbPlaceholder}>{item.title}</span>
            )}
            <span className="sr-only">{item.title}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

type WallLoad =
  | { kind: 'idle' | 'loading' }
  | { kind: 'failed' }
  | { kind: 'ready'; photos: WallPhoto[]; next: string | null; more: boolean }

function useWall() {
  const [wall, setWall] = useState<WallLoad>({ kind: 'idle' })
  const load = (cursor?: string) => {
    setWall((current) =>
      current.kind === 'ready'
        ? { ...current, more: true }
        : { kind: 'loading' }
    )
    void api.getWall(cursor ? { cursor } : {}).then((result) => {
      setWall((current) => {
        if (!result.ok)
          return current.kind === 'ready'
            ? { ...current, more: false }
            : { kind: 'failed' }
        const earlier = current.kind === 'ready' && cursor ? current.photos : []
        return {
          kind: 'ready',
          photos: [...earlier, ...result.data.items],
          next: result.data.nextCursor,
          more: false,
        }
      })
    })
  }
  return { wall, load }
}

export function PhotosView({
  intro,
  proof,
  research,
}: {
  intro: string | null
  proof: readonly ProofPhoto[]
  research: Research | null
}) {
  const [album, setAlbum] = useState<Album>('proof')
  const [open, setOpen] = useState<{ album: Album; index: number } | null>(null)
  const { wall, load } = useWall()
  const shots = useShots((state) => state.shots)

  const proofItems: Viewable[] = proof.map((photo) => ({
    id: photo.id,
    title: photo.title,
    caption: photo.caption,
    ...(photo.image && { image: photo.image }),
  }))
  const wallItems: Viewable[] =
    wall.kind === 'ready'
      ? wall.photos.map((photo) => ({
          id: photo.id,
          title: photo.displayName ?? 'A visitor',
          image: {
            src: photo.src,
            alt: photo.displayName
              ? `Photo by ${photo.displayName}`
              : 'A visitor’s photo',
            width: photo.width,
            height: photo.height,
          },
          wallId: photo.id,
        }))
      : []
  const shotItems: Viewable[] = shots.map((shot, index) => ({
    id: shot.id,
    title: `Your shot ${shots.length - index}`,
    image: {
      src: shot.url,
      alt: 'A photo you took with Camera',
      width: shot.width,
      height: shot.height,
    },
  }))
  const itemsOf = {
    proof: proofItems,
    wall: wallItems,
    worlds: worldItems,
    shots: shotItems,
  } satisfies Record<Album, Viewable[]>

  return (
    <PhoneScreen
      title="Photos"
      accessory={
        <Segmented
          label="Album"
          options={ALBUMS}
          value={album}
          onValueChange={(next) => {
            setAlbum(next)
            // The wall loads the first time its album opens.
            if (next === 'wall' && wall.kind === 'idle') load()
          }}
        />
      }
    >
      {album === 'proof' && (
        <>
          {intro && <p className={s.label}>{intro}</p>}
          {proofItems.length > 0 ? (
            <Grid
              label="Proof"
              items={proofItems}
              onOpen={(index) => setOpen({ album: 'proof', index })}
            />
          ) : (
            <EmptyState title="Page in preparation">
              We’re preparing this album. Please check back soon.
            </EmptyState>
          )}
          {research && (
            <blockquote className={s.research}>
              <p className={s.researchTitle}>{research.title}</p>
              <p>{research.body}</p>
              <footer className={s.researchBy}>{research.attribution}</footer>
            </blockquote>
          )}
        </>
      )}
      {album === 'wall' && (
        <>
          <p className={s.label}>
            Visitors’ photos. Not clients or endorsements.
          </p>
          {(wall.kind === 'idle' || wall.kind === 'loading') && (
            <LoadingState />
          )}
          {wall.kind === 'failed' && (
            <ErrorState title="Couldn’t load the wall" onRetry={() => load()}>
              Check your connection.
            </ErrorState>
          )}
          {wall.kind === 'ready' &&
            (wall.photos.length === 0 ? (
              <EmptyState title="No photos yet">
                Take one with Camera and post it to the wall.
              </EmptyState>
            ) : (
              <>
                <Grid
                  label="Wall"
                  items={wallItems}
                  onOpen={(index) => setOpen({ album: 'wall', index })}
                />
                {wall.next && (
                  <Button
                    variant="ghost"
                    disabled={wall.more}
                    onClick={() => wall.next && load(wall.next)}
                  >
                    {wall.more ? 'Loading' : 'Load more'}
                  </Button>
                )}
              </>
            ))}
        </>
      )}
      {album === 'worlds' && (
        <>
          <p className={s.label}>The brand’s cinematic worlds.</p>
          <Grid
            label="Worlds"
            items={worldItems}
            onOpen={(index) => setOpen({ album: 'worlds', index })}
          />
        </>
      )}
      {album === 'shots' &&
        (shotItems.length === 0 ? (
          <EmptyState title="No photos yet">
            Photos you take with Camera appear here. They stay on this phone.
          </EmptyState>
        ) : (
          <Grid
            label="Your shots"
            items={shotItems}
            onOpen={(index) => setOpen({ album: 'shots', index })}
          />
        ))}
      <Viewer
        items={open ? itemsOf[open.album] : []}
        index={open?.index ?? null}
        onIndex={(index) =>
          setOpen((current) =>
            index === null || !current ? null : { ...current, index }
          )
        }
      />
    </PhoneScreen>
  )
}
