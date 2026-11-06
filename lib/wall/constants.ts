/** Keep this identical to `WALL_CACHE_TAG` in `lib/cms/wall-photos.ts`. */
export const WALL_CACHE_TAG = 'honest-wall'

/**
 * Payload serves uploads under `routes.api` (`/api/cms` in `payload.config.ts`).
 * Approved photos are the only rows whose file route returns 200.
 */
export const WALL_FILE_PREFIX = '/api/cms/wallPhotos/file/'

/** Posts accepted per address. The brief's ceiling, on top of the proxy limit. */
export const WALL_POSTS_PER_HOUR = 3

/** Reports per address. One page of photos, so a person can flag a full page. */
export const WALL_REPORTS_PER_HOUR = 30

/** Removal attempts per address. */
export const WALL_REMOVALS_PER_HOUR = 10

export const WALL_RATE_WINDOW_SECONDS = 60 * 60

/** Short public cache. Editors' status changes also expire `WALL_CACHE_TAG`. */
export const WALL_CACHE_SECONDS = 30

export const WALL_REJECTED_DAYS = 30

/**
 * An upload can land in the directory before its row commits. The daily job
 * leaves files younger than this alone.
 */
export const WALL_ORPHAN_GRACE_MS = 60 * 60 * 1000

export const WALL_PURGE_QUEUE = 'wall.purge'

/** 03:15 UTC. Stays off the other nightly jobs. */
export const WALL_PURGE_CRON = '15 3 * * *'

/** Next free class after the booking lock (582027) and the event flush (582026). */
export const WALL_LOCK_CLASS = 582028
