import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Development only: /lab/3d's "Render poster" saves a scene still into
 * public/posters/ (the tier 0–1 fallbacks), and "Render sequence" saves the
 * demo frame sequence. Production answers 404, so nothing can write files.
 */

const NAME = /^[a-z0-9-]+(?:\/[a-z0-9-]+)?$/u
const MAX_BYTES = 1_500_000
const EXTENSIONS = { 'image/webp': 'webp', 'application/json': 'json' } as const

function extensionFor(contentType: string | null) {
  if (contentType === 'image/webp') return EXTENSIONS['image/webp']
  if (contentType?.startsWith('application/json')) {
    return EXTENSIONS['application/json']
  }
  return null
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return new Response('Not found', { status: 404 })
  }
  const name = new URL(request.url).searchParams.get('name') ?? ''
  const extension = extensionFor(request.headers.get('content-type'))
  if (!NAME.test(name) || !extension) {
    return Response.json({ error: 'Bad name or type' }, { status: 400 })
  }
  const bytes = new Uint8Array(await request.arrayBuffer())
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    return Response.json({ error: 'Empty or too large' }, { status: 413 })
  }
  const file = path.join(
    process.cwd(),
    'public',
    'posters',
    `${name}.${extension}`
  )
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, bytes)
  return Response.json({
    path: `/posters/${name}.${extension}`,
    bytes: bytes.length,
  })
}
