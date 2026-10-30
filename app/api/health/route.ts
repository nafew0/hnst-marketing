import { NextResponse } from 'next/server'

import { getPool, pingDatabase, readHeartbeat } from '@/lib/ghl/postgres'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = getPool()
    const up = await pingDatabase(db)
    if (!up) {
      return NextResponse.json({ ok: false, database: 'down' }, { status: 503 })
    }
    const workerHeartbeat = await readHeartbeat(db)
    return NextResponse.json({ ok: true, database: 'up', workerHeartbeat })
  } catch {
    return NextResponse.json({ ok: false, database: 'down' }, { status: 503 })
  }
}
