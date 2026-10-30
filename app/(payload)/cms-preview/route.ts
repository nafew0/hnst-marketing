import { draftMode, headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { getCms } from '@/lib/cms/data'
export async function GET(request: Request) {
  const cms = await getCms()
  if (!cms) return new Response('CMS unavailable', { status: 503 })
  const { user } = await cms.auth({ headers: await headers() })
  if (!user || (user.role !== 'admin' && user.role !== 'editor'))
    return new Response('Unauthorized', { status: 401 })
  const path = new URL(request.url).searchParams.get('path') ?? '/packages'
  if (
    !/^\/(?:packages(?:\/[a-z-]+)?|legal\/[a-z-]+|contact|link-in-bio)$/u.test(
      path
    )
  )
    return new Response('Invalid preview path', { status: 400 })
  const mode = await draftMode()
  if (new URL(request.url).searchParams.get('exit') === '1') mode.disable()
  else mode.enable()
  return NextResponse.redirect(new URL(path, request.url))
}
