import path from 'node:path'

import type { CollectionConfig, Field, GlobalConfig } from 'payload'

import {
  adminOrSelf,
  adminField,
  contentAccess,
  isAdmin,
  isEditor,
  legalPublished,
} from '@/lib/cms/access'
import { blocks } from '@/lib/cms/blocks'
import { tierSchema } from '@/lib/contracts'
import { env } from '@/lib/env'
const slug: Field = {
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  validate: (value: string | null | undefined) =>
    !value ||
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value) ||
    'Use lowercase words separated by hyphens',
}
const drafts = { drafts: true } as const
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (
          operation === 'create' &&
          (
            await req.payload.count({
              collection: 'users',
              req,
              overrideAccess: true,
            })
          ).totalDocs === 0
        )
          return { ...data, role: 'admin' }
        return data
      },
    ],
  },
  admin: { useAsTitle: 'email' },
  access: {
    admin: ({ req }) =>
      req.user?.role === 'admin' || req.user?.role === 'editor',
    create: isAdmin,
    delete: isAdmin,
    read: adminOrSelf,
    update: adminOrSelf,
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: ['admin', 'editor'],
      access: { create: adminField, update: adminField },
      saveToJWT: true,
    },
  ],
}
export const Packages: CollectionConfig = {
  slug: 'packages',
  admin: { useAsTitle: 'name' },
  access: contentAccess,
  versions: drafts,
  fields: [
    {
      name: 'tier',
      type: 'select',
      options: tierSchema.options,
      required: true,
      unique: true,
    },
    { name: 'name', type: 'text', required: true },
    slug,
    { name: 'price', type: 'number', required: true, min: 0 },
    { name: 'valueLabel', type: 'text' },
    { name: 'turnaround', type: 'text', required: true },
    { name: 'revisions', type: 'text' },
    { name: 'bots', type: 'number', min: 0 },
    {
      name: 'deliverables',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
      ],
    },
    {
      name: 'highlight',
      type: 'checkbox',
      validate: (value, { siblingData }) =>
        !value ||
        ('tier' in siblingData && siblingData.tier === 'founder') ||
        'Only the Founder Package may be highlighted',
    },
    { name: 'order', type: 'number', required: true },
    { name: 'ctaLabel', type: 'text', required: true },
    {
      name: 'ctaType',
      type: 'select',
      options: ['book', 'buy', 'contact'],
      defaultValue: 'contact',
      required: true,
    },
    { name: 'legalDoc', type: 'relationship', relationTo: 'legal-docs' },
  ],
}
export const LegalDocs: CollectionConfig = {
  slug: 'legal-docs',
  admin: { useAsTitle: 'title' },
  access: { ...contentAccess, read: legalPublished },
  versions: drafts,
  fields: [
    { name: 'title', type: 'text', required: true },
    slug,
    { name: 'body', type: 'richText', required: true },
    { name: 'version', type: 'text', required: true },
    { name: 'effectiveDate', type: 'date' },
    {
      name: 'status',
      type: 'select',
      options: ['draft', 'published'],
      defaultValue: 'draft',
      required: true,
    },
  ],
}
export const FAQs: CollectionConfig = {
  slug: 'faqs',
  access: contentAccess,
  versions: drafts,
  admin: { useAsTitle: 'question' },
  fields: [
    { name: 'question', type: 'text', required: true },
    { name: 'answer', type: 'textarea', required: true },
    {
      name: 'category',
      type: 'select',
      options: ['process', 'ownership', 'pricing', 'tools', 'timeline'],
      required: true,
    },
    { name: 'order', type: 'number', required: true },
  ],
}
export const Pages: CollectionConfig = {
  slug: 'pages',
  access: contentAccess,
  versions: drafts,
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    slug,
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
      ],
    },
    { name: 'blocks', type: 'blocks', blocks },
  ],
}
export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: isEditor,
    update: isEditor,
    delete: isAdmin,
  },
  upload: {
    staticDir:
      env.NODE_ENV === 'production'
        ? '/srv/media/uploads'
        : path.resolve('media'),
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    imageSizes: [{ name: 'thumbnail', width: 400 }],
  },
  fields: [{ name: 'alt', type: 'text', required: true }],
}
const links: Field[] = [
  { name: 'label', type: 'text', required: true },
  {
    name: 'url',
    type: 'text',
    required: true,
    validate: (value: string | null | undefined) =>
      !value ||
      value.startsWith('https://') ||
      (value.startsWith('/') && !value.startsWith('//')) ||
      'Use HTTPS or a site-relative URL',
  },
]
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: { read: () => true, update: isEditor },
  fields: [
    { name: 'companyLegalName', type: 'text' },
    { name: 'address', type: 'textarea' },
    { name: 'publicEmail', type: 'email' },
    { name: 'publicPhone', type: 'text' },
    {
      name: 'consentTexts',
      type: 'group',
      fields: [
        { name: 'sms', type: 'textarea', required: true },
        { name: 'email', type: 'textarea', required: true },
        { name: 'approved', type: 'checkbox', defaultValue: false },
      ],
    },
    { name: 'footerLinks', type: 'array', fields: links },
    { name: 'socialLinks', type: 'array', fields: links },
    { name: 'announcementBar', type: 'textarea' },
    { name: 'toolCostDisclosure', type: 'textarea' },
    { name: 'bookingEmbedUrl', type: 'text' },
    {
      name: 'qualifyingQuestions',
      type: 'array',
      fields: [{ name: 'question', type: 'text', required: true }],
    },
    { name: 'ghlTrackingId', type: 'text', access: { update: adminField } },
  ],
}
