import type { Field, GlobalConfig } from 'payload'

import {
  HOME_SCREEN_DEFAULTS as D,
  HOMEPAGE_HREF,
} from '@/components/home-screen/copy'
import { WORLD_CLIPS } from '@/components/world/worlds'
import { isEditor } from '@/lib/cms/access'
import { ADMIN_GROUP } from '@/lib/cms/admin-groups'
import { settingsHooks } from '@/lib/cms/revalidate'

/*
 * The home screen for the high-end offers (components/home-screen). One switch
 * puts it over the site and hides the old app icons and dock; turning it off
 * brings today's site back. An empty field shows the default wording.
 */

const line = (
  name: string,
  label: string,
  defaultValue: string,
  description?: string
): Field => ({
  name,
  type: 'text',
  label,
  defaultValue,
  ...(description && { admin: { description } }),
})

const paragraph = (
  name: string,
  label: string,
  defaultValue: string,
  description?: string
): Field => ({
  name,
  type: 'textarea',
  label,
  defaultValue,
  ...(description && { admin: { description } }),
})

const href: Field = {
  name: 'href',
  type: 'text',
  label: 'Goes to',
  required: true,
  admin: {
    description: `A page on the site, for example /podcast. ${HOMEPAGE_HREF} shows the cinematic homepage.`,
  },
  validate: (value: string | null | undefined) =>
    !value ||
    value === HOMEPAGE_HREF ||
    (value.startsWith('/') && !value.startsWith('//')) ||
    value.startsWith('https://') ||
    `Use a page address starting with /, a full https:// link, or ${HOMEPAGE_HREF}`,
}

const PAGE_HINT = '{page} becomes the name of the page the visitor is on.'

export const HomeScreen: GlobalConfig = {
  slug: 'home-screen',
  label: 'Home screen',
  versions: { drafts: true },
  hooks: settingsHooks,
  admin: {
    group: ADMIN_GROUP.site,
    description:
      'The first screen visitors see: the background video, the big buttons and the Call / Text / Email bar. Press Publish to put changes live.',
  },
  access: { read: () => true, update: isEditor },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Screen',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              label: 'Show the home screen',
              defaultValue: false,
              admin: {
                description:
                  'On: visitors land on this screen, and the old app icons, dock and phone lock screen are hidden. Off: the site is exactly as before.',
              },
            },
            {
              name: 'background',
              type: 'select',
              label: 'Background video',
              defaultValue: D.background,
              options: WORLD_CLIPS.map((clip) => ({ ...clip })),
              admin: {
                components: {
                  Description:
                    '/components/cms/admin/scene-gallery#BackgroundGallery',
                },
              },
            },
            line(
              'title',
              'Site name',
              D.title,
              'Not shown on the screen (the widgets fill it); read by screen readers and search engines.'
            ),
            {
              name: 'buttons',
              type: 'array',
              label: 'Widgets',
              labels: { singular: 'Widget', plural: 'Widgets' },
              minRows: 1,
              maxRows: 6,
              defaultValue: D.buttons.map(({ lines, ...widget }) => ({
                ...widget,
                lines: lines.map((text) => ({ text })),
              })),
              admin: {
                description:
                  'The big panels, top to bottom. Each opens its page. Dylan’s layout has four.',
              },
              fields: [
                { name: 'label', type: 'text', required: true },
                href,
                {
                  name: 'style',
                  type: 'select',
                  required: true,
                  defaultValue: 'headlines',
                  options: [
                    { value: 'headlines', label: 'Headlines that cycle' },
                    { value: 'profile', label: 'Social profile card' },
                  ],
                },
                {
                  name: 'note',
                  type: 'text',
                  label: 'Small badge',
                  admin: { description: 'Optional, e.g. “Our lead offer”.' },
                },
                {
                  name: 'lines',
                  type: 'array',
                  label: 'Headlines',
                  maxRows: 8,
                  admin: {
                    condition: (_, sibling) => sibling?.style !== 'profile',
                    description:
                      'The page’s selling points, one at a time, a few seconds each. Short lines read best.',
                  },
                  fields: [{ name: 'text', type: 'text', required: true }],
                },
                {
                  name: 'handle',
                  type: 'text',
                  admin: {
                    condition: (_, sibling) => sibling?.style === 'profile',
                    description:
                      'Shown under the picture, e.g. @hnstmarketing.',
                  },
                },
              ],
            },
            {
              name: 'links',
              type: 'array',
              label: 'App icons',
              labels: { singular: 'Icon', plural: 'Icons' },
              maxRows: 4,
              defaultValue: D.links,
              admin: {
                description: `The square icons above Call / Text / Email. ${HOMEPAGE_HREF} opens the cinematic homepage.`,
              },
              fields: [{ name: 'label', type: 'text', required: true }, href],
            },
            line(
              'greeting',
              'Greeting for a prospect',
              D.greeting,
              '{name} becomes the name in Prospects. Shown over the widgets when they come by their link.'
            ),
            line(
              'backLabel',
              'Button that returns to this screen',
              D.backLabel,
              'Shown on the cinematic homepage.'
            ),
          ],
        },
        {
          name: 'lock',
          label: 'Lock screen',
          description:
            'The first screen of a visit: a priority notification asking whether they came with an audit. Visitors from a prospect link skip it.',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              label: 'Show the lock screen',
              defaultValue: true,
            },
            line('app', 'Who it’s from', D.lock.app),
            line('tag', 'Label', D.lock.tag),
            line('title', 'Question', D.lock.title),
            line('body', 'Line under the question', D.lock.body),
            line('audit', 'Audit answer', D.lock.audit, 'Opens the widgets.'),
            line(
              'browse',
              'Other answer',
              D.lock.browse,
              'Opens the cinematic homepage.'
            ),
            line('locked', 'If they swipe without picking', D.lock.locked),
            line('hint', 'Swipe hint', D.lock.hint),
          ],
        },
        {
          name: 'bar',
          label: 'Call / Text / Email',
          description:
            'The bar at the bottom of every page, and the Get a Price buttons. The number and address are in Site settings → Contact.',
          fields: [
            line('call', 'Call button', D.bar.call),
            line('text', 'Text button', D.bar.text),
            line('email', 'Email button', D.bar.email),
            line('price', 'Get a Price button', D.bar.price),
            paragraph(
              'textMessage',
              'Text message, written for them',
              D.bar.textMessage,
              PAGE_HINT
            ),
            line(
              'emailSubject',
              'Email subject',
              D.bar.emailSubject,
              PAGE_HINT
            ),
            paragraph('emailBody', 'Email text', D.bar.emailBody, PAGE_HINT),
            paragraph(
              'priceMessage',
              'Get a Price text message',
              D.bar.priceMessage,
              PAGE_HINT
            ),
            line(
              'priceSubject',
              'Get a Price email subject',
              D.bar.priceSubject,
              PAGE_HINT
            ),
          ],
        },
        {
          name: 'offers',
          label: 'Homepage offers',
          description:
            'While the home screen is on, the cinematic homepage shows these three offers, without prices, in place of the packages.',
          fields: [
            line('eyebrow', 'Small heading', D.offers.eyebrow),
            line('heading', 'Heading', D.offers.heading),
            paragraph('body', 'Text', D.offers.body),
            paragraph('terms', 'Fine print', D.offers.terms),
            line('priceLabel', 'Get a Price button', D.offers.priceLabel),
            line('exploreLabel', 'Explore button', D.offers.exploreLabel),
            {
              name: 'items',
              type: 'array',
              label: 'Offers',
              labels: { singular: 'Offer', plural: 'Offers' },
              maxRows: 6,
              defaultValue: D.offers.items,
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'line', type: 'text', required: true },
                href,
                { name: 'badge', type: 'text', label: 'Small badge' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
