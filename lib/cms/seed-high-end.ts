import { getPayload } from 'payload'

import { HOME_SCREEN_DEFAULTS } from '@/components/home-screen/copy'
import { highEndHomepage, highEndPages } from '@/lib/cms/high-end-data'
import config from '@/payload.config'

/*
 * Puts the high-end pivot's copy into the CMS (23 Nov 2026): the six pages,
 * the homepage's words, the home screen and the contact details.
 *
 *   bun --env-file=.env ./lib/cms/seed-high-end.ts            drafts only; the switch stays as is
 *   bun --env-file=.env ./lib/cms/seed-high-end.ts --publish  publishes, and turns the screen on
 *
 * Pages are written whole: an editor's changes to these six pages are replaced,
 * so run it before editors start, or not at all.
 */

const publish = process.argv.includes('--publish')
const status = publish ? 'published' : 'draft'
const context = { skipRevalidation: true }

export async function seedHighEnd() {
  const cms = await getPayload({ config })

  for (const page of highEndPages) {
    const found = await cms.find({
      collection: 'pages',
      where: { slug: { equals: page.slug } },
      draft: true,
      limit: 1,
      depth: 0,
    })
    const existing = found.docs[0]
    const data = { ...page, _status: status } as const
    if (existing)
      await cms.update({
        collection: 'pages',
        id: existing.id,
        draft: !publish,
        data,
        context,
      })
    else
      await cms.create({ collection: 'pages', draft: !publish, data, context })
    console.info(
      `${existing ? 'updated' : 'created'} /${page.slug} (${status})`
    )
  }

  await cms.updateGlobal({
    slug: 'homepage',
    draft: !publish,
    data: { ...highEndHomepage, _status: status },
    context,
  })
  console.info(`homepage words (${status})`)

  await cms.updateGlobal({
    slug: 'home-screen',
    draft: !publish,
    data: {
      ...HOME_SCREEN_DEFAULTS,
      buttons: HOME_SCREEN_DEFAULTS.buttons.map(
        ({ note, handle, lines, ...widget }) => ({
          ...widget,
          note: note ?? null,
          handle: handle ?? null,
          lines: lines.map((text) => ({ text })),
        })
      ),
      links: HOME_SCREEN_DEFAULTS.links.map(({ label, href }) => ({
        label,
        href,
      })),
      offers: {
        ...HOME_SCREEN_DEFAULTS.offers,
        items: HOME_SCREEN_DEFAULTS.offers.items.map(({ badge, ...offer }) => ({
          ...offer,
          badge: badge ?? null,
        })),
      },
      enabled: publish,
      _status: status,
    },
    context,
  })
  console.info(`home screen ${publish ? 'on' : 'saved as a draft, off'}`)

  // Dylan's line and HONEST's inbox (23 Nov 2026), for the Call / Text / Email
  // bar. Publishing needs every required setting filled in; if one is empty,
  // they are saved as a draft and the site keeps its built-in fallback (the
  // same number and address) until an editor publishes Site settings.
  const contact = {
    publicPhone: '+1 945 220 9222',
    publicEmail: 'hello@hnst.marketing',
  }
  try {
    await cms.updateGlobal({
      slug: 'site-settings',
      draft: !publish,
      data: { ...contact, ...(publish && { _status: 'published' as const }) },
      context,
    })
  } catch (error) {
    if (!publish) throw error
    console.warn(
      'Site settings could not be published (a required field is empty); the contact details are saved as a draft.'
    )
    await cms.updateGlobal({
      slug: 'site-settings',
      draft: true,
      data: contact,
      context,
    })
  }
  console.info('contact details set')
}

if (import.meta.main) {
  await seedHighEnd()
  process.exit(0)
}
