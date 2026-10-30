import { RootPage, generatePageMetadata } from '@payloadcms/next/views'

import { importMap } from '@/app/(payload)/admin/importMap'
import { env } from '@/lib/env'
import config from '@/payload.config'
interface Props {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<Record<string, string | string[]>>
}
export function generateMetadata({ params, searchParams }: Props) {
  if (!env.PAYLOAD_SECRET || !env.DATABASE_URL)
    return { title: 'CMS unavailable' }
  return generatePageMetadata({ config, params, searchParams })
}
export default function AdminPage({ params, searchParams }: Props) {
  if (!env.PAYLOAD_SECRET || !env.DATABASE_URL) return null
  return RootPage({ config, importMap, params, searchParams })
}
