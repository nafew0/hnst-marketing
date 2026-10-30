import type { Block, Field } from 'payload'

import { bookingCopyFields, leadCopyFields } from '@/lib/cms/form-copy'
const title: Field = { name: 'title', type: 'text', required: true }
export const blocks: Block[] = [
  {
    slug: 'hero',
    fields: [
      title,
      { name: 'eyebrow', type: 'text' },
      { name: 'description', type: 'textarea' },
    ],
  },
  {
    slug: 'richText',
    fields: [title, { name: 'body', type: 'richText', required: true }],
  },
  {
    slug: 'faqList',
    fields: [
      title,
      {
        name: 'category',
        type: 'select',
        options: ['process', 'ownership', 'pricing', 'tools', 'timeline'],
      },
    ],
  },
  {
    slug: 'cta',
    fields: [
      title,
      { name: 'description', type: 'textarea' },
      { name: 'label', type: 'text', required: true },
      {
        name: 'href',
        type: 'text',
        required: true,
        validate: (value: string | null | undefined) =>
          !value ||
          (value.startsWith('/') && !value.startsWith('//')) ||
          'Use a site-relative URL',
      },
    ],
  },
  { slug: 'packageGrid', fields: [title] },
  { slug: 'comparisonTable', fields: [title] },
  {
    slug: 'processSteps',
    fields: [
      title,
      { name: 'note', type: 'textarea' },
      {
        name: 'items',
        type: 'array',
        required: true,
        fields: [
          title,
          { name: 'description', type: 'textarea', required: true },
        ],
      },
    ],
  },
  {
    slug: 'timeline',
    fields: [
      title,
      {
        name: 'items',
        type: 'array',
        fields: [
          { name: 'date', type: 'text', required: true },
          title,
          { name: 'description', type: 'textarea', required: true },
        ],
      },
    ],
  },
  {
    slug: 'bioCards',
    fields: [
      title,
      {
        name: 'items',
        type: 'array',
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'role', type: 'text', required: true },
          { name: 'body', type: 'textarea', required: true },
          { name: 'photo', type: 'upload', relationTo: 'media' },
          { name: 'placeholder', type: 'text', required: true },
        ],
      },
      { name: 'experienceApproved', type: 'checkbox', defaultValue: false },
      { name: 'experienceLabel', type: 'text' },
    ],
  },
  {
    slug: 'proofGallery',
    fields: [
      title,
      { name: 'closeLabel', type: 'text', required: true },
      { name: 'openLabel', type: 'text', required: true },
      {
        name: 'items',
        type: 'array',
        fields: [
          title,
          { name: 'caption', type: 'textarea', required: true },
          { name: 'image', type: 'upload', relationTo: 'media' },
          { name: 'placeholder', type: 'text', required: true },
        ],
      },
    ],
  },
  {
    slug: 'research',
    fields: [
      title,
      { name: 'body', type: 'textarea', required: true },
      { name: 'attribution', type: 'text', required: true },
    ],
  },
  {
    slug: 'magnet',
    fields: [
      title,
      { name: 'placeholder', type: 'textarea', required: true },
      { name: 'notice', type: 'textarea', required: true },
      {
        name: 'bullets',
        type: 'array',
        fields: [{ name: 'text', type: 'text', required: true }],
      },
      { name: 'copy', type: 'group', fields: leadCopyFields },
    ],
  },
  {
    slug: 'booking',
    fields: [title, { name: 'copy', type: 'group', fields: bookingCopyFields }],
  },
  {
    slug: 'bookingReceipt',
    fields: [title, { name: 'copy', type: 'group', fields: bookingCopyFields }],
  },
]
