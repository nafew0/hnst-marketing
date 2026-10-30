import type { Pool } from 'pg'

export async function insertReceipt(db: Pool, id: string): Promise<boolean> {
  const result = await db.query<{ id: string }>(
    `INSERT INTO integration.webhook_receipts (id, source)
     VALUES ($1, 'ghl-workflow')
     ON CONFLICT (id) DO NOTHING
     RETURNING id`,
    [id]
  )
  return result.rows.length === 1
}

export async function deleteReceipt(db: Pool, id: string): Promise<void> {
  await db.query('DELETE FROM integration.webhook_receipts WHERE id = $1', [id])
}
