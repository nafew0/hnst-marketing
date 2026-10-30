import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import type { ServerFunctionClient } from 'payload'
import type { ReactNode } from 'react'

import { importMap } from '@/app/(payload)/admin/importMap'
import config from '@/payload.config'
import '@payloadcms/next/css'
const serverFunction: ServerFunctionClient = async (args) => {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}
export default function PayloadLayout({ children }: { children: ReactNode }) {
  return RootLayout({ children, config, importMap, serverFunction })
}
