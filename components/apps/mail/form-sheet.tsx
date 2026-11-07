'use client'
import { type ReactNode, useState } from 'react'

import { Button } from '@/components/ui/button'
import { PHONE_LAYOUT } from '@/components/ui/phone/flag'
import { Sheet } from '@/components/ui/phone/kit/sheet'

import s from './mail.module.css'

/** One form: inline by default; moved, never copied, into the opened sheet. */
export function FormSheet({
  title,
  children,
  onOpen,
}: {
  title: string
  children: ReactNode
  onOpen?: () => void
}) {
  const [open, setOpen] = useState(false)
  if (!PHONE_LAYOUT) return children
  return (
    <>
      <div className={s.phone}>
        <Button
          onClick={() => {
            setOpen(true)
            onOpen?.()
          }}
        >
          {title}
        </Button>
      </div>
      {open ? (
        <Sheet title={title} open onOpenChange={setOpen}>
          {children}
        </Sheet>
      ) : (
        <div className={s.inline} data-visit-form-inline>
          {children}
        </div>
      )}
      <noscript>
        <style>{'[data-visit-form-inline]{display:block!important}'}</style>
      </noscript>
    </>
  )
}
