import { failWall, wallDeps } from '@/lib/wall/backend'
import { removeWall } from '@/lib/wall/handle'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  try {
    return await removeWall(request, wallDeps())
  } catch (error) {
    return failWall(
      error instanceof Error ? error : new Error('Wall request failed')
    )
  }
}
