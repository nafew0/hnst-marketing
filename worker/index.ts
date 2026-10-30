import { loadEnv } from '@/lib/ghl/load-env'

loadEnv()

const worker = await import('./main')
await worker.startWorker()
