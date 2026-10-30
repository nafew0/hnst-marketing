import type { Block, Field } from 'payload'
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
]
