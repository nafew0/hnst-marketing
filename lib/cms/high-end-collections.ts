import type { CollectionConfig } from 'payload'
import { z } from 'zod'

import { newProspectToken, PROSPECT_PARAM } from '@/components/prospects/token'
import { contentAccess, isAdmin, isEditor } from '@/lib/cms/access'
import { ADMIN_GROUP } from '@/lib/cms/admin-groups'
import { contentHooks } from '@/lib/cms/revalidate'
import { APP_BASE_URL } from '@/lib/env'

/*
 * Stage 2 of the high-end pivot (23 Nov 2026): the social page's own posts,
 * and a tagged link per prospect, so Dylan can tell when the company he
 * emailed opens it. No cookies: the link carries the tag.
 */

export const SocialPosts: CollectionConfig = {
  slug: 'social-posts',
  access: contentAccess,
  versions: { drafts: true },
  hooks: contentHooks,
  labels: { singular: 'Social post', plural: 'Social posts' },
  admin: {
    useAsTitle: 'caption',
    group: ADMIN_GROUP.site,
    defaultColumns: ['caption', 'postedAt', '_status'],
    description:
      'Our own posts, made here, for the grid on the Social media page. They open on our site, like a social profile; nothing comes from or goes to the networks.',
  },
  defaultSort: '-postedAt',
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description:
          'Square works best (1080 × 1080); the grid crops to a square, the post shows it whole.',
      },
    },
    { name: 'caption', type: 'textarea', required: true },
    {
      name: 'postedAt',
      type: 'date',
      label: 'Posted on',
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
  ],
}

export const Prospects: CollectionConfig = {
  slug: 'prospects',
  labels: { singular: 'Prospect', plural: 'Prospects' },
  access: {
    read: isEditor,
    create: isEditor,
    update: isEditor,
    delete: isAdmin,
  },
  admin: {
    useAsTitle: 'name',
    group: ADMIN_GROUP.prospects,
    defaultColumns: ['name', 'company', 'lastVisit', 'link'],
    description:
      'One tagged link per prospect. Put it in the audit email; when they open it, the visit shows here. Their name greets them on the home screen.',
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) =>
        operation === 'create' && data && !data.token
          ? { ...data, token: newProspectToken() }
          : data,
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'As the greeting should say it, e.g. “Sarah”.' },
    },
    { name: 'company', type: 'text' },
    {
      name: 'greet',
      type: 'checkbox',
      label: 'Greet them by name on the home screen',
      defaultValue: true,
    },
    {
      name: 'link',
      type: 'text',
      virtual: true,
      label: 'Their link',
      admin: {
        readOnly: true,
        description:
          'Copy this into the email. Any page works: add ?p=… to /podcast, for example.',
      },
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            const token = z.string().safeParse(siblingData.token)
            return token.success
              ? `${APP_BASE_URL}/?${PROSPECT_PARAM}=${token.data}`
              : ''
          },
        ],
      },
    },
    {
      name: 'token',
      type: 'text',
      unique: true,
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'lastVisit',
      type: 'date',
      label: 'Last visit',
      admin: {
        readOnly: true,
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    { name: 'note', type: 'textarea', admin: { position: 'sidebar' } },
    {
      name: 'visits',
      type: 'join',
      collection: 'prospect-visits',
      on: 'prospect',
      defaultSort: '-createdAt',
      admin: { defaultColumns: ['kind', 'path', 'device', 'createdAt'] },
    },
  ],
}

export const ProspectVisits: CollectionConfig = {
  slug: 'prospect-visits',
  labels: { singular: 'Visit', plural: 'Visits' },
  // Written by the site only (components/prospects/actions.ts).
  access: {
    read: isEditor,
    create: () => false,
    update: () => false,
    delete: isAdmin,
  },
  admin: {
    group: ADMIN_GROUP.prospects,
    defaultColumns: ['prospect', 'kind', 'path', 'device', 'createdAt'],
    description: 'Every opened link, and the pages viewed after it.',
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'prospect',
      type: 'relationship',
      relationTo: 'prospects',
      required: true,
      index: true,
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { value: 'opened', label: 'Opened the link' },
        { value: 'page', label: 'Viewed a page' },
      ],
    },
    { name: 'path', type: 'text', required: true },
    {
      name: 'device',
      type: 'select',
      options: [
        { value: 'phone', label: 'Phone' },
        { value: 'computer', label: 'Computer' },
      ],
    },
  ],
}
