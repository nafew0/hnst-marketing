import type { Field } from 'payload'

import { PHONE_APPS } from '@/components/ui/phone/registry'
import {
  NOTIFICATION_BODY_MAX,
  NOTIFICATION_TITLE_MAX,
  NOTIFICATION_TRIGGERS,
  PHONE_SETTINGS_DRAFT,
} from '@/components/ui/phone/settings'
import { adminField } from '@/lib/cms/access'

export const phoneSettingsField: Field = {
  name: 'phone',
  type: 'group',
  hooks: {
    beforeChange: [
      ({ value, previousValue, req }) => {
        // Editing previously approved copy needs a fresh Founder review.
        if (
          value &&
          req.user?.role === 'editor' &&
          JSON.stringify(value) !== JSON.stringify(previousValue)
        )
          return { ...value, approved: false }
        return value
      },
    ],
  },
  admin: {
    description: '[DRAFT] Phone copy requires Founder approval before launch.',
  },
  fields: [
    {
      name: 'approved',
      type: 'checkbox',
      defaultValue: false,
      access: { update: adminField },
      admin: {
        description:
          'Enable only after the Founder approves all phone copy. Editors cannot approve it.',
      },
    },
    {
      name: 'lockScreen',
      type: 'checkbox',
      defaultValue: true,
      required: true,
    },
    {
      name: 'notifications',
      type: 'array',
      maxRows: 20,
      defaultValue: PHONE_SETTINGS_DRAFT.notifications,
      fields: [
        {
          name: 'trigger',
          type: 'select',
          required: true,
          options: [...NOTIFICATION_TRIGGERS],
        },
        {
          name: 'app',
          type: 'select',
          required: true,
          options: PHONE_APPS.map((app) => ({
            label: app.label,
            value: app.id,
          })),
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          maxLength: NOTIFICATION_TITLE_MAX,
        },
        {
          name: 'body',
          type: 'textarea',
          required: true,
          maxLength: NOTIFICATION_BODY_MAX,
          admin: {
            description:
              'Only booking-confirmed may use {time}. Queued bookings have no confirmed time. Keep ebook-ready disabled until delivery exists.',
          },
          validate: (value: string | null | undefined, { siblingData }) =>
            !value?.includes('{time}') ||
            ('trigger' in siblingData &&
              siblingData.trigger === 'booking-confirmed') ||
            'Only confirmed bookings may include {time}',
        },
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
          required: true,
        },
      ],
    },
    {
      name: 'widgets',
      type: 'group',
      fields: [
        {
          name: 'nextCallTitle',
          type: 'text',
          required: true,
          maxLength: 40,
          defaultValue: PHONE_SETTINGS_DRAFT.widgets.nextCallTitle,
        },
        {
          name: 'nextCallEmpty',
          type: 'text',
          required: true,
          maxLength: 80,
          defaultValue: PHONE_SETTINGS_DRAFT.widgets.nextCallEmpty,
        },
        {
          name: 'installTitle',
          type: 'text',
          required: true,
          maxLength: 40,
          defaultValue: PHONE_SETTINGS_DRAFT.widgets.installTitle,
        },
        {
          name: 'installBody',
          type: 'textarea',
          required: true,
          maxLength: 140,
          defaultValue: PHONE_SETTINGS_DRAFT.widgets.installBody,
        },
      ],
    },
    {
      name: 'camera',
      type: 'group',
      fields: [
        {
          name: 'frameText',
          type: 'text',
          required: true,
          maxLength: 40,
          defaultValue: PHONE_SETTINGS_DRAFT.camera.frameText,
        },
      ],
    },
    {
      name: 'wall',
      type: 'group',
      fields: [
        {
          name: 'consentText',
          type: 'textarea',
          required: true,
          maxLength: 600,
          defaultValue: PHONE_SETTINGS_DRAFT.wall.consentText,
        },
        {
          name: 'rulesHref',
          type: 'text',
          required: true,
          maxLength: 200,
          defaultValue: PHONE_SETTINGS_DRAFT.wall.rulesHref,
          validate: (value: string | null | undefined) =>
            Boolean(
              value?.startsWith('/') &&
              !value.startsWith('//') &&
              !value.includes('\\')
            ) || 'Use a site-relative rules path',
        },
      ],
    },
  ],
}
