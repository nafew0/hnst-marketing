import { getBoss } from '@/lib/ghl/queue'

import { WALL_PURGE_CRON, WALL_PURGE_QUEUE } from './constants'

/** Once a day at 03:15 UTC. A missed tick is skipped; the next one catches up. */
export async function scheduleWallPurge(): Promise<void> {
  const boss = await getBoss()
  await boss.schedule(
    WALL_PURGE_QUEUE,
    WALL_PURGE_CRON,
    {},
    {
      tz: 'UTC',
      missed: 'skip',
      singletonKey: 'wall-purge',
    }
  )
}
