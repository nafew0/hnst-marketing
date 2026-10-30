import path from 'node:path'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import {
  FAQs,
  LegalDocs,
  Media,
  Packages,
  Pages,
  SiteSettings,
  Users,
} from '@/lib/cms/collections'
import { APP_BASE_URL, env } from '@/lib/env'
if (!env.PAYLOAD_SECRET || !env.DATABASE_URL)
  throw new Error('CMS requires PAYLOAD_SECRET and DATABASE_URL')
export default buildConfig({
  secret: env.PAYLOAD_SECRET,
  serverURL: APP_BASE_URL,
  routes: { admin: '/admin', api: '/api/cms' },
  admin: {
    user: 'users',
    importMap: { baseDir: path.resolve('.'), autoGenerate: false },
  },
  collections: [Users, Packages, LegalDocs, FAQs, Pages, Media],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  sharp,
  db: postgresAdapter({
    pool: { connectionString: env.DATABASE_URL },
    migrationDir: path.resolve('lib/cms/migrations'),
  }),
  typescript: {
    autoGenerate: false,
    postProcess: [
      ({ compiledTypes }) =>
        `export type CmsJson = null | string | number | boolean | CmsJson[] | { [key: string]: CmsJson };\n${compiledTypes}`
          .replaceAll('type: any;', 'type: string;')
          .replaceAll('[k: string]: unknown;', '[k: string]: CmsJson;')
          .replaceAll('unknown[]', 'CmsJson[]')
          .replace(/^\/\* (?:tslint|eslint):?[-a-z]* \*\/\n/gmu, ''),
    ],
    outputFile: path.resolve('lib/cms/payload-types.ts'),
  },
  telemetry: false,
})
