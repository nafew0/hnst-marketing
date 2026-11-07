import { access } from 'node:fs/promises'
import path from 'node:path'

import { expect, test } from '@playwright/test'
import { z } from 'zod'

import { richText } from '@/lib/cms/seed-data'

test.skip(
  process.env.PHONE_CMS_TESTS !== '1',
  'Requires the M3 disposable CMS and its server on :3013 (phone-cms.config.ts)'
)

const photoSchema = z.object({
  id: z.number(),
  publicId: z.uuid(),
  status: z.string(),
  url: z.string(),
  sizes: z.object({
    thumbnail: z.object({ url: z.string(), width: z.number() }),
  }),
})

test('moderation protects originals, thumbnails and evidence through approval and removal', async ({
  playwright,
  request,
  baseURL,
}) => {
  const editor = await playwright.request.newContext({
    ...(baseURL && { baseURL }),
  })
  try {
    const login = await editor.post('/api/cms/users/login', {
      data: {
        email: 'm3-editor@example.test',
        password: 'M3-disposable-local-fixture-only!',
      },
    })
    expect(login.ok()).toBe(true)
    const { token } = z.object({ token: z.string() }).parse(await login.json())
    const headers = { Authorization: `JWT ${token}` }
    const response = await editor.get(
      '/api/cms/wallPhotos?where[displayName][equals]=M3%20fixture%20pending',
      { headers }
    )
    const { docs } = z
      .object({ docs: z.array(photoSchema) })
      .parse(await response.json())
    const photo = docs[0]
    expect(photo).toBeDefined()
    if (!photo) throw new Error('Run phone-cms-setup first')
    expect(photo.sizes.thumbnail.width).toBe(400)
    const paths = [photo.url, photo.sizes.thumbnail.url].map(
      (url) => new URL(url, baseURL).pathname
    )
    const anonymous = await request.get(`/api/cms/wallPhotos/${photo.id}`)
    expect([403, 404]).toContain(anonymous.status())
    for (const file of paths) {
      expect((await request.get(file)).status()).toBe(403)
      expect((await editor.get(file, { headers })).status()).toBe(200)
    }
    expect(
      (await request.post('/api/cms/wallPhotos', { data: {} })).status()
    ).toBe(403)
    expect(
      (
        await request.patch(`/api/cms/wallPhotos/${photo.id}`, {
          data: { status: 'approved' },
        })
      ).status()
    ).toBe(403)
    expect(
      (
        await editor.patch(`/api/cms/wallPhotos/${photo.id}`, {
          headers,
          data: { status: 'approved' },
        })
      ).ok()
    ).toBe(true)
    const published = await request.get(`/api/cms/wallPhotos/${photo.id}`)
    expect(published.ok()).toBe(true)
    const publicDoc = z
      .record(z.string(), z.unknown())
      .parse(await published.json())
    expect(publicDoc.id).toBe(photo.publicId)
    for (const field of [
      'consentText',
      'consentAt',
      'adult',
      'removeTokenHash',
      'reports',
      'statusChangedAt',
    ])
      expect(publicDoc).not.toHaveProperty(field)
    for (const file of paths) {
      const served = await request.get(file)
      expect(served.status()).toBe(200)
      expect(served.headers()['cache-control']).toContain('no-store')
    }
    expect(
      (
        await editor.patch(`/api/cms/wallPhotos/${photo.id}`, {
          headers,
          data: { status: 'pending' },
        })
      ).ok()
    ).toBe(true)
    for (const file of paths)
      expect((await request.get(file)).status()).toBe(403)
    expect(
      (
        await editor.patch(`/api/cms/wallPhotos/${photo.id}`, {
          headers,
          data: { status: 'removed' },
        })
      ).ok()
    ).toBe(true)
    for (const file of paths)
      await expect(
        access(path.resolve('.data/wall', path.basename(file)))
      ).rejects.toThrow()
    for (const file of paths)
      expect((await request.get(file)).status()).toBe(403)
    expect(
      (
        await editor.patch(`/api/cms/wallPhotos/${photo.id}`, {
          headers,
          data: { status: 'approved' },
        })
      ).status()
    ).toBe(400)
  } finally {
    await editor.dispose()
  }
})

test('notes and legal drafts stay private, and editors cannot approve phone copy', async ({
  playwright,
  request,
  baseURL,
}) => {
  const editor = await playwright.request.newContext({
    ...(baseURL && { baseURL }),
  })
  try {
    const login = await editor.post('/api/cms/users/login', {
      data: {
        email: 'm3-editor@example.test',
        password: 'M3-disposable-local-fixture-only!',
      },
    })
    const { token } = z.object({ token: z.string() }).parse(await login.json())
    const headers = { Authorization: `JWT ${token}` }
    const created = await editor.post('/api/cms/phoneNotes', {
      headers,
      data: {
        title: '[DRAFT] Integration note',
        order: 90,
        body: richText('Private draft text'),
        _status: 'draft',
      },
    })
    expect(created.ok()).toBe(true)
    const { doc } = z
      .object({ doc: z.object({ id: z.number() }) })
      .parse(await created.json())
    try {
      expect(
        (await request.get(`/api/cms/phoneNotes/${doc.id}`)).status()
      ).toBe(404)
      expect(
        (
          await editor.patch(`/api/cms/phoneNotes/${doc.id}`, {
            headers,
            data: { _status: 'published' },
          })
        ).ok()
      ).toBe(true)
      expect(
        (await request.get(`/api/cms/phoneNotes/${doc.id}`)).status()
      ).toBe(200)
      expect(
        (
          await editor.patch(`/api/cms/phoneNotes/${doc.id}?draft=true`, {
            headers,
            data: { title: 'Private revision', _status: 'draft' },
          })
        ).ok()
      ).toBe(true)
      const publicNote = await request.get(`/api/cms/phoneNotes/${doc.id}`)
      expect(await publicNote.text()).not.toContain('Private revision')
      const anonymousDraft = await request.get(
        `/api/cms/phoneNotes/${doc.id}?draft=true`
      )
      expect(await anonymousDraft.text()).not.toContain('Private revision')
    } finally {
      // Editors may edit content, but deleting editorial notes is admin-only.
      await editor.patch(`/api/cms/phoneNotes/${doc.id}`, {
        headers,
        data: { _status: 'draft' },
      })
    }
    const adminLogin = await editor.post('/api/cms/users/login', {
      data: {
        email: 'm3-admin@example.test',
        password: 'M3-disposable-local-fixture-only!',
      },
    })
    const adminToken = z
      .object({ token: z.string() })
      .parse(await adminLogin.json()).token
    expect(
      (
        await editor.post('/api/cms/globals/site-settings', {
          headers: { Authorization: `JWT ${adminToken}` },
          data: {
            phone: {
              approved: true,
              widgets: { nextCallTitle: 'Approved fixture title' },
            },
          },
        })
      ).ok()
    ).toBe(true)
    const settings = await editor.post('/api/cms/globals/site-settings', {
      headers,
      data: {
        phone: {
          approved: true,
          widgets: { nextCallTitle: '[DRAFT] Choose a call' },
        },
      },
    })
    expect(settings.ok()).toBe(true)
    const updated = z
      .object({
        phone: z.object({
          approved: z.boolean(),
          widgets: z.object({ nextCallTitle: z.string() }),
        }),
      })
      .parse(
        await (
          await editor.get('/api/cms/globals/site-settings', { headers })
        ).json()
      )
    expect(updated.phone.approved).toBe(false)
    expect(updated.phone.widgets.nextCallTitle).toBe('[DRAFT] Choose a call')
    expect(
      (
        await request.post('/api/cms/globals/site-settings', {
          data: { phone: { approved: true } },
        })
      ).status()
    ).toBe(403)
    const legal = await request.get(
      '/api/cms/legal-docs?where[slug][equals]=wall-rules'
    )
    expect(
      z.object({ totalDocs: z.number() }).parse(await legal.json()).totalDocs
    ).toBe(0)
    const draftSettings = await request.get(
      '/api/cms/globals/site-settings?draft=true'
    )
    expect(draftSettings.status()).toBe(403)
  } finally {
    await editor.dispose()
  }
})

test('editor moderation list opens on pending', async ({ page }) => {
  await page.goto('/admin/login')
  await page
    .getByRole('textbox', { name: 'Email *', exact: true })
    .fill('m3-editor@example.test')
  await page.getByLabel(/^Password/u).fill('M3-disposable-local-fixture-only!')
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await expect(
    page.getByRole('link', { name: 'Wall photos', exact: true }).first()
  ).toBeVisible()
  await page.goto('/admin/collections/wallPhotos')
  await expect(
    page.getByText('M3 fixture approved', { exact: true })
  ).toHaveCount(0)
  await page.screenshot({
    path: 'docs/qa/phone/wall-moderation.png',
    fullPage: true,
  })
})
