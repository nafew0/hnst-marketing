import cn from 'clsx'
import type { ReactNode } from 'react'

import { Link } from '@/components/ui/link'

import s from './kit.module.css'

interface GroupedListProps {
  /** A short heading above the group, as iOS settings lists have. */
  header?: string
  /** A note under the group. */
  footer?: ReactNode
  className?: string | undefined
  children: ReactNode
}

/** A rounded group of rows on glass, like an iOS settings list. */
export function GroupedList({
  header,
  footer,
  className,
  children,
}: GroupedListProps) {
  return (
    <section className={cn(s.group, className)}>
      {header && <h2 className={s.groupHeader}>{header}</h2>}
      <ul className={s.rows}>{children}</ul>
      {footer && <p className={s.groupFooter}>{footer}</p>}
    </section>
  )
}

interface ListRowProps {
  title: ReactNode
  /** Secondary text: a value at the right, or a line under the title. */
  detail?: ReactNode
  /** Under the title instead of at the right. */
  subtitle?: ReactNode
  /** A small icon or app tile at the left. */
  icon?: ReactNode
  /** Makes the row a link, with a chevron. */
  href?: string
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 8 14"
      aria-hidden="true"
      focusable="false"
      className={s.rowChevron}
    >
      <path d="m1 1 6 6-6 6" />
    </svg>
  )
}

/** One row. With `href` it navigates; without it, it only shows a value. */
export function ListRow({ title, detail, subtitle, icon, href }: ListRowProps) {
  const body = (
    <>
      {icon && <span className={s.rowIcon}>{icon}</span>}
      <span className={s.rowText}>
        <span className={s.rowTitle}>{title}</span>
        {subtitle && <span className={s.rowSubtitle}>{subtitle}</span>}
      </span>
      {detail && <span className={s.rowDetail}>{detail}</span>}
      {href && <Chevron />}
    </>
  )
  return (
    <li className={s.rowItem}>
      {href ? (
        <Link href={href} className={s.row}>
          {body}
        </Link>
      ) : (
        <div className={s.row}>{body}</div>
      )}
    </li>
  )
}

/** A number or letter in a small gold tile: a row's icon for steps and the like. */
export function RowBadge({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className={s.badge}>
      {children}
    </span>
  )
}

/** Body text inside a sheet. */
export function SheetText({ children }: { children: ReactNode }) {
  return <p className={s.sheetText}>{children}</p>
}
