'use client'

import cn from 'clsx'
import { type ReactNode, useRef } from 'react'

import { useDeviceTier } from '@/components/motion/device-tier'
import { useScrollProgress } from '@/components/motion/use-scroll-progress'
import type { ProofShot } from '@/components/sections/signature/copy'
import { Image } from '@/components/ui/image'

import s from './proof-booking.module.css'

/** A real screenshot, or a slate that says plainly which one is still coming. */
function Shot({ shot }: { shot: ProofShot }) {
  return (
    <figure className={s.shot}>
      {shot.image ? (
        <Image
          src={shot.image.src}
          alt={shot.image.alt}
          width={shot.image.width}
          height={shot.image.height}
          sizes="(min-width: 800px) 50vw, 100vw"
        />
      ) : (
        <div className={s.slate}>
          <p className="h3 text-gold">{shot.label}</p>
          <p className="caption text-silver">Real screenshot goes here</p>
        </div>
      )}
      <figcaption className="caption text-silver">{shot.caption}</figcaption>
    </figure>
  )
}

/**
 * Pinned on desktop while the frame's content scrolls inside it. The strip moves
 * by a share of its own height, so the page never measures it.
 */
export function ProofFrame({
  shots,
  intro,
}: {
  shots: readonly ProofShot[]
  intro: ReactNode
}) {
  const { state } = useDeviceTier()
  const stripRef = useRef<HTMLDivElement>(null)
  const travel = 100 - 100 / shots.length

  const setTrackRef = useScrollProgress(
    (progress) => {
      if (stripRef.current) {
        stripRef.current.style.transform = `translateY(${(-progress * travel).toFixed(2)}%)`
      }
    },
    {
      start: 'top top',
      end: 'bottom bottom',
      disabled: state?.motionMedia !== true,
    }
  )

  return (
    <div ref={setTrackRef} className={s.track}>
      <div className={cn(s.stage, 'dr-layout-block')}>
        {intro}
        <div className={s.device}>
          <div className={s.deviceBar} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className={s.deviceScreen}>
            <div ref={stripRef} className={s.strip}>
              {shots.map((shot) => (
                <Shot key={shot.label} shot={shot} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
