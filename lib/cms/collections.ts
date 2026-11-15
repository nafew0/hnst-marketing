import path from 'node:path'

import {
  Forbidden,
  type CollectionConfig,
  type Field,
  type GlobalConfig,
} from 'payload'

import {
  adminOrSelf,
  adminField,
  contentAccess,
  isAdmin,
  isEditor,
  legalPublished,
} from '@/lib/cms/access'
import { ADMIN_GROUP } from '@/lib/cms/admin-groups'
import { blocks } from '@/lib/cms/blocks'
import { cmsEnvironment } from '@/lib/cms/environment'
import { phoneSettingsField } from '@/lib/cms/phone-settings'
import { contentHooks, settingsHooks } from '@/lib/cms/revalidate'
import { tierSchema } from '@/lib/contracts'
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
  labels: { singular: 'Team member', plural: 'Team' },
  admin: {
    useAsTitle: 'email',
    group: ADMIN_GROUP.team,
    description:
      'Who can sign in here. Admins manage the team; editors edit content.',
  },
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
      admin: { description: 'Admins can also manage the team.' },
      access: { create: adminField, update: adminField },
      saveToJWT: true,
    },
  ],
}
export const Packages: CollectionConfig = {
  slug: 'packages',
  labels: { singular: 'Package', plural: 'Packages and prices' },
  admin: {
    useAsTitle: 'name',
    group: ADMIN_GROUP.site,
    defaultColumns: ['name', 'price', 'turnaround', '_status'],
    description:
      'The four packages: shown on the Packages pages and the homepage. Press Publish to put changes live.',
  },
  access: contentAccess,
  versions: drafts,
  hooks: contentHooks,
  fields: [
    {
      name: 'tier',
      type: 'select',
      options: tierSchema.options,
      required: true,
      unique: true,
      admin: { description: 'Which package this is. Each one exists once.' },
    },
    { name: 'name', type: 'text', required: true },
    {
      ...slug,
      admin: { description: 'Its web address: /packages/<this>.' },
    },
    {
      name: 'price',
      type: 'number',
      label: 'Price (USD)',
      required: true,
      min: 0,
      admin: { description: 'Whole dollars, no symbol.' },
    },
    {
      name: 'valueLabel',
      type: 'text',
      label: 'Line under the price',
      admin: { description: 'Optional, for example “One-time”.' },
    },
    {
      name: 'turnaround',
      type: 'text',
      label: 'Delivery time',
      required: true,
      admin: { description: 'For example “7–14 days”.' },
    },
    { name: 'revisions', type: 'text', label: 'Revisions included' },
    { name: 'bots', type: 'number', label: 'Specialist bots', min: 0 },
    {
      name: 'deliverables',
      type: 'array',
      label: 'What’s included',
      labels: { singular: 'Item', plural: 'Items' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
      ],
    },
    {
      name: 'highlight',
      type: 'checkbox',
      label: 'Highlight as the lead offer',
      admin: { description: 'Only the Founder Package can be highlighted.' },
      validate: (value, { siblingData }) =>
        !value ||
        ('tier' in siblingData && siblingData.tier === 'founder') ||
        'Only the Founder Package may be highlighted',
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      admin: { description: 'Lower numbers come first.' },
    },
    { name: 'ctaLabel', type: 'text', label: 'Button text', required: true },
    {
      name: 'ctaType',
      type: 'select',
      label: 'Button goes to',
      options: [
        { label: 'Book a call', value: 'book' },
        { label: 'Buy', value: 'buy' },
        { label: 'Contact form', value: 'contact' },
      ],
      defaultValue: 'contact',
      required: true,
    },
    {
      name: 'legalDoc',
      type: 'relationship',
      label: 'Terms for this package',
      relationTo: 'legal-docs',
    },
  ],
}
export const LegalDocs: CollectionConfig = {
  slug: 'legal-docs',
  labels: { singular: 'Legal page', plural: 'Legal pages' },
  admin: {
    useAsTitle: 'title',
    group: ADMIN_GROUP.site,
    defaultColumns: ['title', 'version', 'status', 'updatedAt'],
    description:
      'Privacy, terms and the rest. A page shows on the site only when its Status is published.',
  },
  access: { ...contentAccess, read: legalPublished },
  versions: drafts,
  hooks: contentHooks,
  fields: [
    { name: 'title', type: 'text', required: true },
    slug,
    { name: 'body', type: 'richText', required: true },
    {
      name: 'version',
      type: 'text',
      required: true,
      admin: {
        description: 'For example “1.0”. Change it when the text changes.',
      },
    },
    { name: 'effectiveDate', type: 'date', label: 'In effect from' },
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
  hooks: contentHooks,
  labels: { singular: 'FAQ', plural: 'FAQs' },
  admin: {
    useAsTitle: 'question',
    group: ADMIN_GROUP.site,
    defaultColumns: ['question', 'category', 'order', '_status'],
    description: 'Questions and answers shown on the site.',
  },
  fields: [
    { name: 'question', type: 'text', required: true },
    { name: 'answer', type: 'textarea', required: true },
    {
      name: 'category',
      type: 'select',
      options: ['process', 'ownership', 'pricing', 'tools', 'timeline'],
      required: true,
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      admin: { description: 'Lower numbers come first.' },
    },
  ],
}
export const Pages: CollectionConfig = {
  slug: 'pages',
  access: contentAccess,
  versions: drafts,
  hooks: contentHooks,
  admin: {
    useAsTitle: 'title',
    group: ADMIN_GROUP.site,
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    description:
      'The site’s pages, except the homepage (its text is part of the design). Press Publish to put changes live.',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      ...slug,
      admin: { description: 'Its web address, for example “about”.' },
    },
    {
      name: 'seo',
      type: 'group',
      label: 'Search and sharing',
      admin: {
        description: 'How the page appears in Google and in shared links.',
      },
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        {
          name: 'ogImage',
          type: 'upload',
          label: 'Share image',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'blocks',
      type: 'blocks',
      label: 'Page sections',
      admin: { description: 'The page’s sections, top to bottom.' },
      blocks,
    },
  ],
}
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image', plural: 'Images' },
  admin: {
    group: ADMIN_GROUP.library,
    description: 'Images used on the site’s pages.',
  },
  access: {
    read: () => true,
    create: isEditor,
    update: isEditor,
    delete: isAdmin,
  },
  upload: {
    staticDir: cmsEnvironment.MEDIA_DIR ?? path.resolve('media'),
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    imageSizes: [{ name: 'thumbnail', width: 400 }],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Description',
      required: true,
      admin: {
        description: 'What the image shows, for people who can’t see it.',
      },
    },
  ],
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
  versions: { drafts: true },
  hooks: {
    ...settingsHooks,
    beforeOperation: [
      ({ args, req }) => {
        if (
          args.draft &&
          args.overrideAccess !== true &&
          req.user?.role !== 'admin' &&
          req.user?.role !== 'editor'
        )
          throw new Forbidden(req.t)
        return args
      },
    ],
  },
  label: 'Site settings',
  admin: {
    group: ADMIN_GROUP.site,
    description:
      'Contact details, booking, consent text and the phone layout. Press Publish to put changes live.',
  },
  access: { read: () => true, update: isEditor },
  fields: [
    // Unnamed tabs only arrange the form: the stored fields are unchanged.
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contact',
          fields: [
            {
              name: 'companyLegalName',
              type: 'text',
              label: 'Company legal name',
            },
            { name: 'address', type: 'textarea' },
            {
              name: 'publicEmail',
              type: 'email',
              label: 'Public email',
              admin: {
                description: 'Shown on the site, and opened by the Mail icon.',
              },
            },
            {
              name: 'publicPhone',
              type: 'text',
              label: 'Public phone',
              admin: {
                description:
                  'International format, for example +1 555 123 4567. Used by the Phone and Messages icons.',
              },
            },
            {
              name: 'socialLinks',
              type: 'array',
              label: 'Social profiles',
              labels: { singular: 'Profile', plural: 'Profiles' },
              admin: {
                description:
                  'HONEST’s own profile links. Until one is set, the icon opens the network’s home page.',
              },
              fields: links,
            },
            {
              name: 'footerLinks',
              type: 'array',
              label: 'Extra footer links',
              labels: { singular: 'Link', plural: 'Links' },
              fields: links,
            },
          ],
        },
        {
          label: 'Booking',
          fields: [
            {
              name: 'bookingEmbedUrl',
              type: 'text',
              label: 'Booking calendar link',
              admin: {
                description:
                  'Shown if live availability can’t load, so visitors can still book.',
              },
            },
            {
              name: 'qualifyingQuestions',
              type: 'array',
              label: 'Questions asked when booking',
              labels: { singular: 'Question', plural: 'Questions' },
              fields: [{ name: 'question', type: 'text', required: true }],
            },
          ],
        },
        {
          label: 'Text and consent',
          fields: [
            {
              name: 'consentTexts',
              type: 'group',
              label: 'Consent text',
              admin: {
                description:
                  'The exact words beside the email and SMS checkboxes. Forms stay off on the live site until “Approved” is ticked.',
              },
              fields: [
                { name: 'sms', type: 'textarea', label: 'SMS', required: true },
                { name: 'email', type: 'textarea', required: true },
                { name: 'approved', type: 'checkbox', defaultValue: false },
              ],
            },
            {
              name: 'toolCostDisclosure',
              type: 'textarea',
              label: 'Tool costs note',
              admin: {
                description: 'Shown with the packages: what tools cost on top.',
              },
            },
            {
              name: 'announcementBar',
              type: 'textarea',
              label: 'Announcement',
              admin: { description: 'Optional. Leave empty to show none.' },
            },
          ],
        },
        { label: 'Phone layout', fields: [phoneSettingsField] },
        {
          label: 'Tracking',
          fields: [
            {
              name: 'ghlTrackingId',
              type: 'text',
              label: 'GoHighLevel tracking ID',
              admin: { description: 'Admins only. Loads only after consent.' },
              access: { update: adminField },
            },
          ],
        },
      ],
    },
  ],
}
