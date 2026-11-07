'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Image } from '@/components/ui/image'
import { Sheet } from '@/components/ui/phone/kit/sheet'

import { saveShot, shareShot } from './capture'
import { PostForm } from './post'
import { useWallPosts } from './posts'
import { type Shot, removeShot } from './shots'

import s from './camera.module.css'

export type ShotSheetMode = 'actions' | 'post'

interface ShotSheetProps {
  /** The photo; null keeps the sheet closed. */
  shot: Shot | null
  mode: ShotSheetMode
  onModeChange: (mode: ShotSheetMode) => void
  onClose: () => void
}

/**
 * One photo's sheet: Save, Share, Post to the wall and Delete, then the post
 * form in the same sheet, so no sheet opens over another. Camera and Photos
 * both use it.
 */
export function ShotSheet({
  shot,
  mode,
  onModeChange,
  onClose,
}: ShotSheetProps) {
  return (
    <Sheet
      title={mode === 'post' ? 'Post to the HONEST wall' : 'Your photo'}
      open={shot !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      {shot &&
        (mode === 'post' ? (
          <PostForm key={shot.id} shot={shot} />
        ) : (
          <ShotActions
            key={shot.id}
            shot={shot}
            onPost={() => onModeChange('post')}
            onDeleted={onClose}
          />
        ))}
    </Sheet>
  )
}

function ShotActions({
  shot,
  onPost,
  onDeleted,
}: {
  shot: Shot
  onPost: () => void
  onDeleted: () => void
}) {
  const posted = useWallPosts((state) =>
    Boolean(state.posts[shot.id]?.removalLink)
  )
  const [status, setStatus] = useState('')

  return (
    <div className={s.actions}>
      <div className={s.actionsPreview}>
        <Image
          src={shot.url}
          alt="Your shot in the HONEST frame"
          width={shot.width}
          height={shot.height}
          mobileSize="70vw"
          desktopSize="30vw"
        />
      </div>
      <div className={s.actionRow}>
        <Button
          variant="ghost"
          onClick={() => {
            saveShot(shot)
            setStatus('Saved to your downloads.')
          }}
        >
          Save
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            void shareShot(shot).then((result) => {
              if (result === 'saved')
                setStatus('Sharing isn’t available here, so it was saved.')
              else setStatus('')
            })
          }}
        >
          Share
        </Button>
      </div>
      <Button variant="gold" onClick={onPost}>
        {posted ? 'Posted: see your removal link' : 'Post to the wall'}
      </Button>
      <Button
        variant="link"
        onClick={() => {
          removeShot(shot.id)
          onDeleted()
        }}
      >
        Delete photo
      </Button>
      <p role="status" className={s.note}>
        {status}
      </p>
    </div>
  )
}
