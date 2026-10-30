import { config } from '@dotenvx/dotenvx'

/** Decrypts `.env` before any module reads `@/lib/env`. Call before a dynamic import. */
export function loadEnv() {
  config({ quiet: true })
}
