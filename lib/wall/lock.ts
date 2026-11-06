import { WALL_LOCK_CLASS } from './constants'
import type { WallDb, WallQuery } from './types'

/**
 * One Idempotency-Key, or one photo's reports, at a time. `run` gets the
 * connection that holds the lock and sends its SQL there. Asking the pool for
 * a second connection while holding one freezes the shared pool as soon as
 * every connection holds or waits for a lock: twelve parallel reports did, in
 * review. Payload's Local API uses its own pool, so `run` may call it.
 */
export async function withWallLock<T>(
  db: WallDb,
  key: string,
  run: (locked: WallQuery) => Promise<T>
): Promise<T> {
  const client = await db.connect()
  try {
    await client.query('SELECT pg_advisory_lock($1, hashtext($2))', [
      WALL_LOCK_CLASS,
      key,
    ])
    try {
      return await run(client)
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
