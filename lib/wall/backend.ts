import type { Pool } from 'pg'
import pino from 'pino'

import { env } from '@/lib/env'
import { verifyAltcha } from '@/lib/ghl/captcha'
import { getPool } from '@/lib/ghl/postgres'
import { errorJson } from '@/lib/ghl/respond'
import { getClientIP } from '@/lib/utils/rate-limit'

import { cachedApproved } from './cache'
import { resolveWallDirectory } from './directory'
import type { WallDeps } from './handle'
import { createPayloadWallStore, type WallCms } from './payload-store'
import type { SqlValue, WallDb, WallStore } from './types'

const logger = pino({ level: 'info' })

let shared: WallStore | undefined

export function wallDeps(): WallDeps {
  const secret = env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is not set')
  const hmacKey = env.ALTCHA_HMAC_KEY
  return {
    store: openStore(),
    cursorSecret: secret,
    clientIp: getClientIP,
    verifyCaptcha: (payload) => {
      if (!hmacKey) return Promise.resolve(false)
      return verifyAltcha(payload, hmacKey)
    },
  }
}

export function failWall(error: Error): Response {
  if (error.message === 'ALTCHA_HMAC_KEY is not set') {
    logger.error(error.message)
    return errorJson('internal_error', 'Captcha is not configured.', 500)
  }
  if (error.message === 'PAYLOAD_SECRET is not set') logger.error(error.message)
  else logger.error({ name: error.name }, 'wall request failed')
  return errorJson(
    'internal_error',
    'Something went wrong. Please try again.',
    500
  )
}

function openStore(): WallStore {
  if (shared !== undefined) return shared
  const created = createPayloadWallStore(
    wallDatabase(),
    loadWallCms,
    resolveWallDirectory(env.WALL_MEDIA_DIR)
  )
  const listApproved = cachedApproved(created)
  shared = {
    findReceipt: created.findReceipt,
    createPost: created.createPost,
    listApproved,
    findRemovable: created.findRemovable,
    markRemoved: created.markRemoved,
    report: created.report,
    deleteRejectedBefore: created.deleteRejectedBefore,
    listFilenames: created.listFilenames,
  }
  return shared
}

export function wallDatabase(): WallDb {
  return asWallDb(getPool())
}

export function loadWallCms(): Promise<WallCms> {
  return loadCms()
}

async function loadCms(): Promise<WallCms> {
  const { getPayload } = await import('payload')
  const { default: config } = await import('@/payload.config')
  const payload = await getPayload({ config })
  // SAFETY: M3 registers wallPhotos on this Payload instance. The generated
  // Config slug union does not include that collection until it is merged, so
  // the Local API is called through WallCms and its field names.
  return payload as WallCms
}

function asWallDb(pool: Pool): WallDb {
  return {
    async query<Row>(sql: string, params?: readonly SqlValue[]) {
      const result = await pool.query(
        sql,
        params === undefined ? undefined : [...params]
      )
      const rows: Row[] = result.rows
      return { rows }
    },
    async connect() {
      const client = await pool.connect()
      return {
        async query<Row>(sql: string, params?: readonly SqlValue[]) {
          const result = await client.query(
            sql,
            params === undefined ? undefined : [...params]
          )
          const rows: Row[] = result.rows
          return { rows }
        },
        release() {
          client.release()
        },
      }
    },
  }
}
