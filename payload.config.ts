import { randomBytes } from 'node:crypto'
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
import { PhoneNotes } from '@/lib/cms/phone-notes'
import { WallPhotos } from '@/lib/cms/wall-photos'
import { APP_BASE_URL, env } from '@/lib/env'
export default buildConfig({
  // Importable during unconfigured builds; requests are guarded separately.
  secret: env.PAYLOAD_SECRET ?? randomBytes(32).toString('base64url'),
  serverURL: APP_BASE_URL,
  routes: { admin: '/admin', api: '/api/cms' },
  admin: {
    user: 'users',
    importMap: { baseDir: path.resolve('.'), autoGenerate: false },
    // The HONEST look and a start page (components/cms/admin/brand.tsx).
    // After changing these paths, run `bun run cms:importmap`, then change its
    // `../../../components/` imports to `@/components/` (lint forbids ../../).
    theme: 'dark',
    meta: { titleSuffix: ' · HONEST Admin' },
    components: {
      providers: ['/components/cms/admin/brand#AdminBrandStyles'],
      graphics: {
        Logo: '/components/cms/admin/brand#AdminLogo',
        Icon: '/components/cms/admin/brand#AdminIcon',
      },
      beforeDashboard: ['/components/cms/admin/brand#AdminStart'],
    },
  },
  // The admin menu follows this order: Website, Phone app, Library, Team.
  collections: [
    Packages,
    Pages,
    FAQs,
    LegalDocs,
    WallPhotos,
    PhoneNotes,
    Media,
    Users,
  ],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  sharp,
  db: postgresAdapter({
    pool: {
      connectionString:
        env.DATABASE_URL ?? 'postgres://127.0.0.1/cms-unconfigured',
    },
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
