'use client'

import type { ReactNode } from 'react'

import { Sheet } from './sheet'

import s from './kit.module.css'

interface SheetRowProps {
  title: string
  subtitle?: ReactNode
  icon?: ReactNode
  /** What the sheet shows: the row's detail. */
  children: ReactNode
}

/** A grouped-list row that opens its detail in a bottom sheet. */
export function SheetRow({ title, subtitle, icon, children }: SheetRowProps) {
  return (
    <li className={s.rowItem}>
      <Sheet
        title={title}
        trigger={
          <button type="button" className={s.row}>
            {icon && <span className={s.rowIcon}>{icon}</span>}
            <span className={s.rowText}>
              <span className={s.rowTitle}>{title}</span>
              {subtitle && <span className={s.rowSubtitle}>{subtitle}</span>}
            </span>
            <svg
              viewBox="0 0 8 14"
              aria-hidden="true"
              focusable="false"
              className={s.rowChevron}
            >
              <path d="m1 1 6 6-6 6" />
            </svg>
          </button>
        }
      >
        {children}
      </Sheet>
    </li>
  )
}
