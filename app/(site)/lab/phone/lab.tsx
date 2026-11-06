'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { GroupedList, ListRow } from '@/components/ui/phone/kit/list'
import { PhoneScreen } from '@/components/ui/phone/kit/screen'
import { Segmented } from '@/components/ui/phone/kit/segmented'
import { Sheet } from '@/components/ui/phone/kit/sheet'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/ui/phone/kit/states'
import {
  notify,
  resetNotifications,
  setCentreOpen,
} from '@/components/ui/phone/notifications/store'
import { PHONE_APPS } from '@/components/ui/phone/registry'
import { NOTIFICATION_TRIGGERS } from '@/components/ui/phone/settings'
import { PhoneAppIcon } from '@/components/ui/window/dock-icons'

import s from './lab.module.css'

const STATES = [
  { value: 'empty', label: 'Empty' },
  { value: 'loading', label: 'Loading' },
  { value: 'error', label: 'Error' },
] as const

type StateName = (typeof STATES)[number]['value']

/** Everything the phone layout offers app builders, on one page. */
export function PhoneLab() {
  const [state, setState] = useState<StateName>('empty')
  return (
    <PhoneScreen
      title="Phone layout"
      accessory={
        <p className={s.note}>
          Lab · noindex. Notifications show as banners on phones only; open the
          centre to see them all.
        </p>
      }
      className={s.lab}
    >
      <GroupedList header="Icons" footer="Shared with the macOS dock.">
        {PHONE_APPS.map((app) => (
          <ListRow
            key={app.id}
            icon={<PhoneAppIcon id={app.id} />}
            title={app.label}
            subtitle={app.name}
            detail={`${app.owner}, ${app.phase}`}
          />
        ))}
      </GroupedList>

      <GroupedList header="Rows">
        <ListRow title="A link row" href="/lab" />
        <ListRow title="A value row" detail="Value" />
        <ListRow title="With a subtitle" subtitle="A second line, quieter." />
      </GroupedList>

      <section className={s.block}>
        <Segmented
          label="State"
          options={STATES}
          value={state}
          onValueChange={setState}
        />
        {state === 'empty' && (
          <EmptyState title="No photos yet">
            Photos you take with Camera appear here.
          </EmptyState>
        )}
        {state === 'loading' && <LoadingState />}
        {state === 'error' && (
          <ErrorState title="Couldn’t load" onRetry={() => setState('loading')}>
            Check your connection.
          </ErrorState>
        )}
      </section>

      <section className={s.block}>
        <Sheet
          title="A sheet"
          description="Swipe down, press Done or Esc to close."
          trigger={<Button variant="ghost">Open a sheet</Button>}
        >
          <p className={s.note}>Forms go here, with their own state.</p>
        </Sheet>
      </section>

      <GroupedList
        header="Notifications"
        footer="Each fires once per visit. Reset to start a fresh visit."
      >
        {NOTIFICATION_TRIGGERS.map((trigger) => (
          <li key={trigger} className={s.triggerRow}>
            <Button
              variant="link"
              onClick={() => notify(trigger, { time: 'Tue 10 Nov, 10:30' })}
            >
              notify('{trigger}')
            </Button>
          </li>
        ))}
      </GroupedList>
      <label className={s.field}>
        <span>Type here: no banner interrupts typing</span>
        <input type="text" name="typing" className={s.input} />
      </label>
      <div className={s.actions}>
        <Button variant="ghost" onClick={() => setCentreOpen(true)}>
          Open the Notification Centre
        </Button>
        <Button variant="ghost" onClick={resetNotifications}>
          Reset notifications
        </Button>
      </div>
    </PhoneScreen>
  )
}
