import { loadEnv } from '@/lib/ghl/load-env'

loadEnv()

await import('./migrate-run')
