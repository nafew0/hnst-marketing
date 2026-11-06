import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'

import s from './kit.module.css'

interface StateProps {
  title: string
  children?: ReactNode
}

/** Nothing to show yet, e.g. an album with no photos. */
export function EmptyState({ title, children }: StateProps) {
  return (
    <div className={s.state}>
      <p className={s.stateTitle}>{title}</p>
      {children && <div className={s.stateBody}>{children}</div>}
    </div>
  )
}

/** Waiting on the network. Announced politely, never animated at tier 0. */
export function LoadingState({ title = 'Loading' }: Partial<StateProps>) {
  return (
    <div className={s.state} role="status">
      <span aria-hidden="true" className={s.spinner} />
      <p className={s.stateTitle}>{title}</p>
    </div>
  )
}

interface ErrorStateProps extends StateProps {
  /** Offers "Try again" when given. */
  onRetry?: () => void
}

/** Something failed. Says what, and offers a retry when one can help. */
export function ErrorState({ title, children, onRetry }: ErrorStateProps) {
  return (
    <div className={s.state} role="alert">
      <p className={s.stateTitle}>{title}</p>
      {children && <div className={s.stateBody}>{children}</div>}
      {onRetry && (
        <Button variant="ghost" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
