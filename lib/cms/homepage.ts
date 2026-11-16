import type { Field, GlobalConfig } from 'payload'

import {
  fallbackSteps,
  filmCopy,
  heroCopy,
  packagesCopy,
  platterCopy,
  proofCopy,
  stepsCopy,
  turnCopy,
} from '@/components/sections/signature/copy'
import { isEditor } from '@/lib/cms/access'
import { ADMIN_GROUP } from '@/lib/cms/admin-groups'
import { settingsHooks } from '@/lib/cms/revalidate'

/*
 * The homepage's words (components/sections/signature/home-copy.ts reads
 * them). Every field starts with today's wording, and an empty field falls
 * back to it, so nothing here can blank the page. The animations, links and
 * images stay in code. Lists whose length the design depends on (the
 * platter's six props, the film's three chapters, the three proof shots) are
 * fixed at that length.
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

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Homepage',
  versions: { drafts: true },
  hooks: settingsHooks,
  admin: {
    group: ADMIN_GROUP.site,
    description:
      'The homepage’s words, section by section. Press Publish to put them live. A field left empty shows the original wording.',
  },
  access: { read: () => true, update: isEditor },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'hero',
          label: '1 · Top',
          description: 'The first screen: the headline and its two buttons.',
          fields: [
            line('eyebrow', 'Small line above', heroCopy.eyebrow),
            line('line1', 'Headline, first line', heroCopy.lines[0]),
            line('line2', 'Headline, second line', heroCopy.lines[1]),
            paragraph('lede', 'Intro', heroCopy.lede),
            line(
              'primaryLabel',
              'Gold button',
              heroCopy.primaryCta.label,
              'Opens the booking page.'
            ),
            line(
              'secondaryLabel',
              'Second button',
              heroCopy.secondaryCta.label,
              'Opens the packages page.'
            ),
          ],
        },
        {
          name: 'film',
          label: '2 · Story',
          description: 'The scrolling film: “Back in my day” and its chapters.',
          fields: [
            line(
              'title',
              'Section name',
              filmCopy.title,
              'Read by screen readers.'
            ),
            line('pinnedLine', 'Opening line', filmCopy.pinnedLine),
            {
              name: 'chapters',
              type: 'array',
              label: 'Chapters',
              labels: { singular: 'Chapter', plural: 'Chapters' },
              minRows: 3,
              maxRows: 3,
              admin: {
                description:
                  'Three, matched to the film’s pictures and timing, in order.',
              },
              defaultValue: filmCopy.chapters.map(({ label, body }) => ({
                label,
                body,
              })),
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'body', type: 'textarea', required: true },
              ],
            },
          ],
        },
        {
          name: 'turn',
          label: '3 · The turn',
          description: 'The dunes, then the statement on the warm background.',
          fields: [
            line('heading', 'Heading over the dunes', turnCopy.heading),
            paragraph('body', 'Statement', turnCopy.body),
            line('closing', 'Closing line (gold)', turnCopy.closing),
          ],
        },
        {
          name: 'platter',
          label: '4 · Golden platter',
          description: 'What’s on the platter.',
          fields: [
            line('eyebrow', 'Small line above', platterCopy.eyebrow),
            line('heading', 'Heading', platterCopy.heading),
            paragraph('body', 'Text', platterCopy.body),
            line('note', 'Small print', platterCopy.note),
            {
              name: 'deliverables',
              type: 'array',
              label: 'The six items',
              labels: { singular: 'Item', plural: 'Items' },
              minRows: 6,
              maxRows: 6,
              admin: {
                description:
                  'Six, one for each object on the platter, in the order they appear.',
              },
              defaultValue: platterCopy.deliverables.map(
                ({ name, description }) => ({ name, description })
              ),
              fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'description', type: 'text', required: true },
              ],
            },
          ],
        },
        {
          name: 'steps',
          label: '5 · How it works',
          fields: [
            line('heading', 'Heading', stepsCopy.heading),
            line('note', 'Small print', stepsCopy.note),
            {
              name: 'items',
              type: 'array',
              label: 'Steps',
              labels: { singular: 'Step', plural: 'Steps' },
              minRows: 1,
              admin: { description: 'In order. Drag to reorder.' },
              defaultValue: fallbackSteps.map(({ title, description }) => ({
                title,
                description,
              })),
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'description', type: 'textarea', required: true },
              ],
            },
          ],
        },
        {
          name: 'packages',
          label: '6 · Packages',
          description:
            'The section around the package cards. The cards’ names, prices and delivery times come from Packages and prices; the tool-costs note from Site settings.',
          fields: [
            line('eyebrow', 'Small line above', packagesCopy.eyebrow),
            line('heading', 'Heading', packagesCopy.heading),
            paragraph('terms', 'Terms note', packagesCopy.terms),
          ],
        },
        {
          name: 'proof',
          label: '7 · Proof and booking',
          fields: [
            line('eyebrow', 'Small line above', proofCopy.eyebrow),
            line('heading', 'Heading', proofCopy.heading),
            paragraph('body', 'Text', proofCopy.body),
            {
              name: 'shots',
              type: 'array',
              label: 'Screenshot captions',
              labels: { singular: 'Caption', plural: 'Captions' },
              minRows: 3,
              maxRows: 3,
              admin: {
                description:
                  'Three, for the three screenshots, in order. The pictures stay as they are.',
              },
              defaultValue: proofCopy.shots.map(({ label, caption }) => ({
                label,
                caption,
              })),
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'caption', type: 'text', required: true },
              ],
            },
            line('ctaHeading', 'Closing heading', proofCopy.ctaHeading),
            line(
              'ctaLabel',
              'Closing button',
              proofCopy.cta.label,
              'Opens the booking page.'
            ),
          ],
        },
      ],
    },
  ],
}
