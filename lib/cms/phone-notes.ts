import type { CollectionConfig } from 'payload'

import { contentAccess } from '@/lib/cms/access'
import { ADMIN_GROUP } from '@/lib/cms/admin-groups'
import { contentHooks } from '@/lib/cms/revalidate'

export const PhoneNotes: CollectionConfig = {
  slug: 'phoneNotes',
  labels: { singular: 'Phone note', plural: 'Phone notes' },
  admin: {
    group: ADMIN_GROUP.phone,
    useAsTitle: 'title',
    defaultColumns: ['title', '_status', 'order'],
    description:
      'HONEST editorial notes only. Visitor notes stay in memory and are never saved here.',
  },
  access: contentAccess,
  versions: { drafts: true },
  defaultSort: 'order',
  hooks: contentHooks,
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'body', type: 'richText', required: true },
    { name: 'order', type: 'number', required: true, defaultValue: 0 },
  ],
}
