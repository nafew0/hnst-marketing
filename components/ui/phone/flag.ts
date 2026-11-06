/**
 * The phone layout ships behind `NEXT_PUBLIC_PHONE_LAYOUT=1` until M9, so
 * `main` stays releasable while it is built (docs/phases/M1.md). Inlined at
 * build time, and readable on the server and in the browser alike.
 */
export const PHONE_LAYOUT = process.env.NEXT_PUBLIC_PHONE_LAYOUT === '1'
