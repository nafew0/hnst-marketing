'use client'

import { Drawer } from '@base-ui/react/drawer'
import type { ReactElement, ReactNode } from 'react'

import s from './kit.module.css'

interface SheetProps {
  title: string
  description?: string
  /** The button that opens it, rendered as the trigger. Omit when `open` is controlled. */
  trigger?: ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

/**
 * A bottom sheet: Base UI's Drawer, modal, swiped down or closed with its
 * button or Esc. For forms in sheets (Packages' "I'm interested", Mail), the
 * form lives inside and keeps its own state.
 */
export function Sheet({
  title,
  description,
  trigger,
  open,
  onOpenChange,
  children,
}: SheetProps) {
  return (
    <Drawer.Root
      swipeDirection="down"
      {...(open !== undefined && { open })}
      {...(onOpenChange && {
        onOpenChange: (next: boolean) => onOpenChange(next),
      })}
    >
      {trigger && <Drawer.Trigger render={trigger} />}
      <Drawer.Portal>
        <Drawer.Backdrop className={s.sheetBackdrop} />
        <Drawer.Viewport className={s.sheetViewport}>
          <Drawer.Popup className={s.sheet} data-theme="dark">
            <span aria-hidden="true" className={s.sheetHandle} />
            <Drawer.Content className={s.sheetContent}>
              <div className={s.sheetHead}>
                <Drawer.Title className={s.sheetTitle}>{title}</Drawer.Title>
                <Drawer.Close className={s.sheetClose}>Done</Drawer.Close>
              </div>
              {description && (
                <Drawer.Description className={s.sheetDescription}>
                  {description}
                </Drawer.Description>
              )}
              {children}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
