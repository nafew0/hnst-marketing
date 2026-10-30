import { runner } from 'node-pg-migrate'

import { env } from '@/lib/env'

const databaseUrl = env.DATABASE_URL
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. For localhost, run `bun run db:up` and set DATABASE_URL to postgres://hnst:hnst@localhost:5432/hnst.'
  )
}

await runner({
  databaseUrl,
  dir: 'db/migrations',
  direction: 'up',
  migrationsTable: 'pgmigrations',
  migrationsSchema: 'integration',
  schema: 'integration',
  createSchema: true,
  createMigrationsSchema: true,
  log: (message: string) => {
    console.log(message)
  },
})
