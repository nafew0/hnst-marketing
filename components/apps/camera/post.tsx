'use client'

import { type FormEvent, useId, useRef, useState } from 'react'

import { Captcha } from '@/components/forms/captcha'
import { Button } from '@/components/ui/button'
import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import {
  notify,
  useNotifications,
} from '@/components/ui/phone/notifications/store'
import {
  WALL_NAME_MAX,
  type WallPostInput,
  altchaSchema,
} from '@/lib/contracts'
import { api } from '@/lib/contracts/client'

import { postFailure } from './post-messages'
import { markPosted, postKeyFor, useWallPosts } from './posts'
import type { Shot } from './shots'

import s from './camera.module.css'

const PRIVACY_HREF = '/legal/privacy'

type PostState =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'failed'; message: string; fields: Record<string, string> }

/**
 * Posts one shot to the wall (docs/phases/M7.md). The consent sent is the
 * text shown beside the box, word for word, and both boxes start unticked.
 * Every attempt for a photo reuses its Idempotency-Key, so a double tap or a
 * retry stores one photo. Nothing is uploaded until the visitor posts.
 */
export function PostForm({ shot }: { shot: Shot }) {
  const id = useId()
  const consentText = useNotifications(
    (state) => state.settings.wall.consentText
  )
  const rulesHref = useNotifications((state) => state.settings.wall.rulesHref)
  const removalLink = useWallPosts((state) => state.posts[shot.id]?.removalLink)
  const [state, setState] = useState<PostState>({ kind: 'idle' })
  const [captchaKey, setCaptchaKey] = useState(0)
  const sendingRef = useRef(false)

  if (removalLink) return <Posted link={removalLink} />

  const fields = state.kind === 'failed' ? state.fields : {}
  const fieldError = (name: string) =>
    fields[name] ? (
      <p id={`${id}-${name}-error`} className={s.fieldError}>
        {fields[name]}
      </p>
    ) : null
  const describedBy = (name: string) =>
    fields[name] ? `${id}-${name}-error` : undefined

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sendingRef.current) return
    const form = new FormData(event.currentTarget)
    const missing: Record<string, string> = {}
    if (form.get('consent') !== 'on')
      missing.consentText = 'Tick this box to post your photo.'
    if (form.get('adult') !== 'on')
      missing.adult = 'The wall is for people 18 or over.'
    const altcha = altchaSchema.safeParse(form.get('altcha'))
    if (!altcha.success) missing.altcha = 'Complete the check first.'
    if (!altcha.success || Object.keys(missing).length > 0) {
      setState({
        kind: 'failed',
        message: 'Some details need attention.',
        fields: missing,
      })
      return
    }

    sendingRef.current = true
    setState({ kind: 'sending' })
    const input: WallPostInput = {
      image: shot.blob,
      consentText,
      adult: true,
      altcha: altcha.data,
    }
    const name = String(form.get('displayName') ?? '').trim()
    if (name) input.displayName = name
    const result = await api.postWallPhoto(input, postKeyFor(shot.id))
    sendingRef.current = false
    if (result.ok) {
      markPosted(shot.id, result.data)
      setState({ kind: 'idle' })
      notify('wall-sent')
      return
    }
    if (result.error.code === 'captcha_failed') setCaptchaKey((key) => key + 1)
    setState({
      kind: 'failed',
      message: postFailure(result.status, result.error.code),
      fields: result.error.fields ?? {},
    })
  }

  const sending = state.kind === 'sending'

  return (
    <form
      className={s.post}
      noValidate
      onSubmit={(event) => void submit(event)}
    >
      <div className={s.postPreview}>
        <Image
          src={shot.url}
          alt="What you’re posting, in the HONEST frame"
          width={shot.width}
          height={shot.height}
          mobileSize="40vw"
          desktopSize="20vw"
        />
      </div>
      <p className={s.note}>
        An editor checks every photo before it appears. Visitors’ photos are
        never shown as client work.
      </p>

      <div className={s.field}>
        <label htmlFor={`${id}-name`} className={s.fieldLabel}>
          Name or handle (optional)
        </label>
        <input
          id={`${id}-name`}
          name="displayName"
          type="text"
          autoComplete="off"
          maxLength={WALL_NAME_MAX}
          className={s.input}
          disabled={sending}
          aria-invalid={fields.displayName ? true : undefined}
          aria-describedby={describedBy('displayName')}
        />
        {fieldError('displayName')}
      </div>

      <label className={s.check}>
        <input
          name="consent"
          type="checkbox"
          className={s.box}
          disabled={sending}
          aria-invalid={fields.consentText ? true : undefined}
          aria-describedby={describedBy('consentText')}
        />
        <span>{consentText}</span>
      </label>
      {fieldError('consentText')}

      <label className={s.check}>
        <input
          name="adult"
          type="checkbox"
          className={s.box}
          disabled={sending}
          aria-invalid={fields.adult ? true : undefined}
          aria-describedby={describedBy('adult')}
        />
        <span>I’m 18 or over.</span>
      </label>
      {fieldError('adult')}

      <p className={s.links}>
        <Link href={rulesHref} newTab className={s.link}>
          Wall rules
        </Link>
        <Link href={PRIVACY_HREF} newTab className={s.link}>
          Privacy policy
        </Link>
      </p>

      <Captcha key={captchaKey} />
      {fieldError('altcha')}

      {state.kind === 'failed' && (
        <p role="alert" className={s.alert}>
          {state.message}
          {fields.image && ` ${fields.image}`}
        </p>
      )}
      <p role="status" className="sr-only">
        {sending ? 'Sending your photo' : ''}
      </p>

      <Button type="submit" variant="gold" disabled={sending}>
        {sending ? 'Sending…' : 'Post to the wall'}
      </Button>
    </form>
  )
}

/** A 202: the photo waits for an editor, and the visitor keeps the removal link. */
function Posted({ link }: { link: string }) {
  const [copy, setCopy] = useState<'idle' | 'copied' | 'failed'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()

  const copyLink = () => {
    void navigator.clipboard
      .writeText(link)
      .then(() => setCopy('copied'))
      .catch(() => {
        inputRef.current?.select()
        setCopy('failed')
      })
  }

  return (
    <div className={s.post}>
      <div role="status" className={s.posted}>
        <p className={s.postedTitle}>Waiting for approval</p>
        <p>
          An editor checks your photo before it appears on the wall. That can
          take a little while.
        </p>
      </div>
      <label htmlFor={id} className={s.fieldLabel}>
        Your removal link
      </label>
      <p className={s.note}>
        Keep it: it removes your photo at any time. It isn’t shown again after
        this visit.
      </p>
      <input
        ref={inputRef}
        id={id}
        readOnly
        value={link}
        className={s.input}
        onFocus={(event) => event.currentTarget.select()}
      />
      <Button variant="ghost" onClick={copyLink}>
        {copy === 'copied' ? 'Copied' : 'Copy link'}
      </Button>
      {copy === 'failed' && (
        <p role="alert" className={s.note}>
          Couldn’t copy. The link is selected: copy it from the box.
        </p>
      )}
    </div>
  )
}
