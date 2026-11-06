import { WALL_LOCK_CLASS } from './constants'
import type { WallDb } from './types'

/**
 * One Idempotency-Key, or one photo's reports, at a time. The lock is held
 * on its own connection while the work uses the main pool, matching bookings.
 */
export async function withWallLock<T>(
  db: WallDb,
  key: string,
  run: () => Promise<T>
): Promise<T> {
  const client = await db.connect()
  try {
    await client.query('SELECT pg_advisory_lock($1, hashtext($2))', [
      WALL_LOCK_CLASS,
      key,
    ])
    try {
      return await run()
    } finally {
      await client.query('SELECT pg_advisory_unlock($1, hashtext($2))', [
        WALL_LOCK_CLASS,
        key,
      ])
    }
  } finally {
    client.release()
  }
}
