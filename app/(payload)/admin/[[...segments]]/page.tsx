import { RootPage, generatePageMetadata } from '@payloadcms/next/views'

import { importMap } from '@/app/(payload)/admin/importMap'
import config from '@/payload.config'
interface Props {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<Record<string, string | string[]>>
}
export function generateMetadata({ params, searchParams }: Props) {
  return generatePageMetadata({ config, params, searchParams })
}
export default function AdminPage({ params, searchParams }: Props) {
  return RootPage({ config, importMap, params, searchParams })
}
