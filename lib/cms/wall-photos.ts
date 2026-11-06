import { randomUUID } from 'node:crypto'
import { unlink } from 'node:fs/promises'
import path from 'node:path'

import { revalidateTag } from 'next/cache'
import { APIError, type CollectionConfig, type FieldAccess } from 'payload'

import { isEditor } from '@/lib/cms/access'
import { WALL_NAME_MAX, wallPhotoIdSchema } from '@/lib/contracts/wall'
import { env } from '@/lib/env'

export const WALL_CACHE_TAG = 'honest-wall'
export const wallMediaDirectory = path.resolve(
  env.WALL_MEDIA_DIR ?? './.data/wall'
)
const publicDirectory = path.resolve('public')
if (
  wallMediaDirectory === publicDirectory ||
  wallMediaDirectory.startsWith(`${publicDirectory}${path.sep}`)
)
  throw new Error('WALL_MEDIA_DIR must be outside public/')

const staffField: FieldAccess = ({ req }) =>
  req.user?.role === 'admin' || req.user?.role === 'editor'
const immutable = { update: () => false }
const privateEvidence = { read: staffField, ...immutable }

/** Remove only known upload basenames, including every generated thumbnail. */
export async function removeWallFiles(
  directory: string,
  filenames: (string | null | undefined)[]
) {
  for (const filename of new Set(filenames)) {
    if (!filename) continue
    if (
      path.basename(filename) !== filename ||
      filename === '.' ||
      filename === '..'
    )
      throw new Error('Invalid wall filename')
    try {
      await unlink(path.join(directory, filename))
    } catch (error) {
      if (
        !(error instanceof Error && 'code' in error && error.code === 'ENOENT')
      )
        throw error
    }
  }
}

export const WallPhotos: CollectionConfig<'wallPhotos'> = {
  slug: 'wallPhotos',
  graphQL: false,
  forceSelect: { publicId: true },
  labels: { singular: 'Wall photo', plural: 'Wall photos' },
  defaultSort: '-createdAt',
  admin: {
    useAsTitle: 'publicId',
    defaultColumns: [
      'filename',
      'displayName',
      'createdAt',
      'reports',
      'status',
    ],
    description:
      'Visitors’ photos, not clients or endorsements. Opens on pending; choose a Status filter to review other photos.',
    baseFilter: ({ req }) =>
      req.query.where ? null : { status: { equals: 'pending' } },
  },
  access: {
    read: ({ req }) =>
      req.user?.role === 'admin' || req.user?.role === 'editor'
        ? true
        : { status: { equals: 'approved' } },
    create: () => false,
    update: isEditor,
    delete: isEditor,
  },
  upload: {
    staticDir: wallMediaDirectory,
    mimeTypes: ['image/webp'],
    bulkUpload: false,
    pasteURL: false,
    crop: false,
    focalPoint: false,
    adminThumbnail: 'thumbnail',
    imageSizes: [{ name: 'thumbnail', width: 400, withoutEnlargement: true }],
    modifyResponseHeaders: ({ headers }) => {
      // Recheck moderation on every request, even after a previously public photo is hidden.
      headers.set('Cache-Control', 'private, no-store')
      headers.set('X-Robots-Tag', 'noindex, noimageindex')
      return headers
    },
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        if (
          originalDoc?.status === 'removed' &&
          data.status &&
          data.status !== 'removed'
        )
          throw new APIError('Removed photos cannot be restored.', 400)
        if (!originalDoc || (data.status && data.status !== originalDoc.status))
          data.statusChangedAt = new Date().toISOString()
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        if (doc.status === 'removed')
          await removeWallFiles(wallMediaDirectory, [
            doc.filename,
            doc.sizes?.thumbnail?.filename,
          ])
        if (doc.status !== previousDoc?.status && !req.context.skipRevalidation)
          revalidateTag(WALL_CACHE_TAG, { expire: 0 })
        return doc
      },
    ],
    afterDelete: [
      ({ doc, req }) => {
        if (!req.context.skipRevalidation)
          revalidateTag(WALL_CACHE_TAG, { expire: 0 })
        return doc
      },
    ],
    afterRead: [
      ({ doc, req }) => {
        // Public REST documents use the UUID. GraphQL is disabled for this collection.
        if (!req.user && req.payloadAPI !== 'local')
          return { ...doc, id: doc.publicId }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'publicId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      defaultValue: () => randomUUID(),
      access: immutable,
      admin: { readOnly: true },
      validate: (value: string | null | undefined) =>
        wallPhotoIdSchema.safeParse(value).success ||
        'A public UUID is required',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: ['pending', 'approved', 'rejected', 'removed'],
    },
    { name: 'displayName', type: 'text', maxLength: WALL_NAME_MAX },
    {
      name: 'consentText',
      type: 'textarea',
      required: true,
      maxLength: 2000,
      access: privateEvidence,
      admin: { readOnly: true },
    },
    {
      name: 'consentAt',
      type: 'date',
      required: true,
      access: privateEvidence,
      admin: { readOnly: true },
    },
    {
      name: 'adult',
      type: 'checkbox',
      required: true,
      access: privateEvidence,
      admin: { readOnly: true },
      validate: (value: boolean | null | undefined) =>
        value === true || 'Adult confirmation is required',
    },
    {
      name: 'removeTokenHash',
      type: 'text',
      required: true,
      access: { read: () => false, ...immutable },
      admin: { hidden: true },
    },
    {
      name: 'reports',
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 0,
      access: privateEvidence,
      admin: { readOnly: true },
    },
    {
      name: 'statusChangedAt',
      defaultValue: () => new Date().toISOString(),
      type: 'date',
      required: true,
      index: true,
      access: privateEvidence,
      admin: { readOnly: true },
    },
  ],
}
