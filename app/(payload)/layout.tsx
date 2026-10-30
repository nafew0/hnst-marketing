import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import type { ServerFunctionClient } from 'payload'
import type { ReactNode } from 'react'

import { importMap } from '@/app/(payload)/admin/importMap'
import { env } from '@/lib/env'
import config from '@/payload.config'
import '@payloadcms/next/css'
const serverFunction: ServerFunctionClient = async (args) => {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}
export default function PayloadLayout({ children }: { children: ReactNode }) {
  if (!env.PAYLOAD_SECRET || !env.DATABASE_URL)
    return (
      <html lang="en">
        <body>
          <h1>CMS unavailable</h1>
          <p>Configure the CMS environment to enable administration.</p>
        </body>
      </html>
    )
  return RootLayout({ children, config, importMap, serverFunction })
}
