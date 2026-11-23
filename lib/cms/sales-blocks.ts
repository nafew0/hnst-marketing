import type { Block, Field, TextFieldSingleValidation } from 'payload'
import { z } from 'zod'

/** A button row whose kind is a link to a page (the others need no address). */
const isLink = z.object({ kind: z.literal('link') })

/*
 * The long sales pages for the high-end offers (Nov 2026): Mobile Application,
 * Podcast, Launch Content Gallery, Offers, About. Every word is editable;
 * components/sections/sales draws them. Buttons are Call, Text, Email or
 * Get a Price (the visitor's own apps, with the message written for them),
 * or a link to another page.
 */

export const ACTION_KINDS = ['call', 'text', 'email', 'price', 'link'] as const

export const GROUP_STYLES = [
  ['cards', 'Cards'],
  ['list', 'List'],
  ['steps', 'Numbered steps'],
  ['statements', 'Short statements'],
  ['tags', 'Tags'],
  ['yes', 'This is for you if'],
  ['no', 'This isn’t for you if'],
  ['panel', 'Highlighted panel'],
  ['apps', 'Apps with figures'],
  ['placeholders', 'Placeholders for proof'],
] as const

const actions: Field = {
  name: 'actions',
  type: 'array',
  label: 'Buttons',
  labels: { singular: 'Button', plural: 'Buttons' },
  maxRows: 6,
  admin: {
    description:
      'Call, Text, Email and Get a Price open the visitor’s phone or email with the message from Home screen → Call / Text / Email, naming this page.',
  },
  fields: [
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'call',
      options: [
        { value: 'call', label: 'Call' },
        { value: 'text', label: 'Text' },
        { value: 'email', label: 'Email' },
        { value: 'price', label: 'Get a Price' },
        { value: 'link', label: 'Link to a page' },
      ],
    },
    {
      name: 'label',
      type: 'text',
      admin: {
        description: 'Leave empty for the usual word (Call, Text, Email…).',
      },
    },
    {
      name: 'href',
      type: 'text',
      label: 'Goes to',
      admin: {
        condition: (_, sibling) => sibling?.kind === 'link',
        description: 'A page address, e.g. /offers, or #section on this page.',
      },
      validate: ((value, { siblingData }) => {
        if (!isLink.safeParse(siblingData).success) return true
        if (!value) return 'A link needs an address'
        return (
          (value.startsWith('/') && !value.startsWith('//')) ||
          value.startsWith('#') ||
          'Use a page address starting with / or #'
        )
      }) satisfies TextFieldSingleValidation,
    },
  ],
}

const anchor: Field = {
  name: 'anchor',
  type: 'text',
  label: 'Section name for links',
  admin: {
    description:
      'Optional. Lets a button link here, e.g. “payback” for #payback.',
  },
  validate: (value: string | null | undefined) =>
    !value || /^[a-z][a-z0-9-]*$/u.test(value) || 'Lowercase letters and -',
}

const heading = (name: string, label: string, required = false) =>
  ({ name, type: 'text', label, required }) satisfies Field

const paragraphs = (name: string, label: string, description?: string) =>
  ({
    name,
    type: 'textarea',
    label,
    ...(description && { admin: { description } }),
  }) satisfies Field

const BODY_HINT = 'A blank line starts a new paragraph.'

const salesHero: Block = {
  slug: 'salesHero',
  labels: { singular: 'Sales top', plural: 'Sales tops' },
  fields: [
    heading('badge', 'Badge', false),
    heading('title', 'Headline', true),
    heading('subheadline', 'Subheadline'),
    paragraphs('body', 'Text', BODY_HINT),
    {
      name: 'points',
      type: 'array',
      label: 'Short points',
      maxRows: 4,
      fields: [heading('title', 'Point', true), heading('text', 'Detail')],
    },
    actions,
  ],
}

const salesSection: Block = {
  slug: 'salesSection',
  labels: { singular: 'Sales section', plural: 'Sales sections' },
  fields: [
    anchor,
    heading('eyebrow', 'Small heading'),
    heading('title', 'Headline', true),
    heading('subheadline', 'Subheadline'),
    paragraphs('body', 'Text', BODY_HINT),
    {
      name: 'groups',
      type: 'array',
      label: 'Lists',
      labels: { singular: 'List', plural: 'Lists' },
      maxRows: 6,
      admin: {
        description:
          'Cards, steps, tags and so on. “For you” and “Not for you” sit side by side.',
      },
      fields: [
        heading('heading', 'List heading'),
        {
          name: 'style',
          type: 'select',
          required: true,
          defaultValue: 'cards',
          options: GROUP_STYLES.map(([value, label]) => ({ value, label })),
        },
        paragraphs('intro', 'Text above the list'),
        {
          name: 'items',
          type: 'array',
          fields: [
            heading('title', 'Title'),
            paragraphs('text', 'Text'),
            {
              name: 'stat',
              type: 'text',
              label: 'Figure',
              admin: { description: 'Apps only, e.g. “12,000+”.' },
            },
            heading('statLabel', 'What the figure counts'),
            {
              name: 'url',
              type: 'text',
              label: 'Link',
              validate: (value: string | null | undefined) =>
                !value ||
                value.startsWith('https://') ||
                'Use a full https:// link',
            },
          ],
        },
        {
          name: 'sampleFigures',
          type: 'checkbox',
          label: 'The figures are samples',
          defaultValue: false,
          admin: {
            description:
              'Shows “Sample figures” under the list. Untick only when every figure is real.',
          },
        },
      ],
    },
    paragraphs('note', 'Fine print'),
    heading('closing', 'Closing line'),
    actions,
    {
      name: 'topic',
      type: 'text',
      label: 'Name in messages',
      admin: {
        description:
          'Optional. What this section’s Text, Email and Get a Price messages name, e.g. “Podcast” on the Offers page. Empty: the page’s title.',
      },
    },
    {
      name: 'closingStyle',
      type: 'checkbox',
      label: 'Show as the page’s closing call',
      defaultValue: false,
      admin: {
        description: 'Large headline over the background video, big buttons.',
      },
    },
  ],
}

const objections: Block = {
  slug: 'objections',
  labels: { singular: 'Objections', plural: 'Objections' },
  fields: [
    anchor,
    heading('title', 'Headline', true),
    heading('subheadline', 'Subheadline'),
    {
      name: 'items',
      type: 'array',
      label: 'Questions',
      minRows: 1,
      fields: [
        heading('question', 'What they’re thinking', true),
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
    paragraphs('closing', 'Line after the answers'),
    actions,
  ],
}

const comparison: Block = {
  slug: 'offerComparison',
  labels: { singular: 'Comparison table', plural: 'Comparison tables' },
  fields: [
    anchor,
    heading('title', 'Headline', true),
    heading('subheadline', 'Subheadline'),
    {
      name: 'columns',
      type: 'array',
      minRows: 1,
      maxRows: 4,
      fields: [heading('name', 'Offer', true), heading('badge', 'Badge')],
    },
    {
      name: 'rows',
      type: 'array',
      fields: [
        heading('label', 'Row', true),
        {
          name: 'cells',
          type: 'array',
          admin: { description: 'One per offer, in the same order.' },
          fields: [{ name: 'text', type: 'text', required: true }],
        },
      ],
    },
    paragraphs('note', 'Fine print'),
    actions,
  ],
}

/**
 * The social media page (21 Nov 2026): HONEST's profile and its own post grid,
 * from Social posts. Links go out to the networks; nothing is embedded.
 */
const socialProfile: Block = {
  slug: 'socialProfile',
  labels: { singular: 'Social profile', plural: 'Social profiles' },
  fields: [
    { ...heading('title', 'Name', true), defaultValue: 'HONEST Marketing' },
    { ...heading('handle', 'Handle'), defaultValue: '@hnstmarketing' },
    paragraphs('bio', 'Bio'),
    {
      ...heading('followLabel', 'Follow button word'),
      defaultValue: 'Follow on',
      admin: {
        description:
          'Followed by the network, e.g. “Follow on Instagram”. One button per profile in Site settings → Social profiles; networks without one are hidden.',
      },
    },
    {
      ...heading('postsHeading', 'Heading over the posts'),
      defaultValue: 'Posts',
    },
    {
      ...heading('viewLabel', 'Link to the original post'),
      defaultValue: 'View on',
    },
    {
      ...paragraphs('emptyText', 'When there are no posts yet'),
      defaultValue:
        'The first posts are on their way. Until then, the fastest line to us is a call, a text or an email.',
    },
  ],
}

export const salesBlocks: Block[] = [
  socialProfile,
  salesHero,
  salesSection,
  objections,
  comparison,
]
