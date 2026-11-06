'use client'

import { Drawer } from '@base-ui/react/drawer'

import { useOpenApp } from '../open'
import { phoneApp } from '../registry'
import { NotificationCard } from './card'
import { clearNotifications, setCentreOpen, useNotifications } from './store'

import s from './notifications.module.css'

/**
 * The Notification Centre: every notification of the visit, newest first,
 * from the top of the screen. Swipe it up, press Close or Esc to put it away.
 */
export function NotificationCentre() {
  const open = useNotifications((state) => state.centreOpen)
  const delivered = useNotifications((state) => state.delivered)
  const openApp = useOpenApp()

  return (
    <Drawer.Root
      swipeDirection="up"
      open={open}
      onOpenChange={(next) => setCentreOpen(next)}
    >
      <Drawer.Portal>
        <Drawer.Backdrop className={s.centreBackdrop} />
        <Drawer.Viewport className={s.centreViewport}>
          <Drawer.Popup className={s.centre} data-theme="dark">
            <Drawer.Content className={s.centreContent}>
              <div className={s.centreHead}>
                <Drawer.Title className={s.centreTitle}>
                  Notifications
                </Drawer.Title>
                {delivered.length > 0 && (
                  <button
                    type="button"
                    className={s.centreAction}
                    onClick={clearNotifications}
                  >
                    Clear
                  </button>
                )}
              </div>
              {delivered.length === 0 ? (
                <p className={s.centreEmpty}>No notifications</p>
              ) : (
                <ul className={s.centreList}>
                  {delivered.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={s.centreItem}
                        onClick={() => {
                          setCentreOpen(false)
                          openApp(phoneApp(item.app))
                        }}
                      >
                        <NotificationCard item={item} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <Drawer.Close className={s.centreClose}>Close</Drawer.Close>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
