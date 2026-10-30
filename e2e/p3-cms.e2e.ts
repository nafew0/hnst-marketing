import { expect, test } from '@playwright/test'
test.skip(
  !process.env.DATABASE_URL,
  'Requires the disposable CMS fixture database'
)
test('editor updates the catalog but cannot promote their role or read drafts anonymously', async ({
  page,
  request,
}) => {
  const login = await request.post('/api/cms/users/login', {
    data: {
      email: 'p3-editor@example.test',
      password: 'P3-disposable-local-fixture-only!',
    },
  })
  expect(login.ok()).toBe(true)
  const loginBody = await login.json()
  const headers = { Authorization: `JWT ${loginBody.token}` }
  const listing = await request.get(
    '/api/cms/packages?where[tier][equals]=founder',
    { headers }
  )
  const { docs } = await listing.json()
  const item = docs[0]
  expect(item.price).toBeGreaterThan(0)
  try {
    const changed = await request.patch(`/api/cms/packages/${item.id}`, {
      headers,
      data: { price: 5100, _status: 'published' },
    })
    expect(changed.ok()).toBe(true)
    await page.goto('/packages')
    await expect(page.getByText('$5,100', { exact: true })).toBeVisible()
  } finally {
    await request.patch(`/api/cms/packages/${item.id}`, {
      headers,
      data: { price: item.price, _status: 'published' },
    })
  }
  await request.patch(`/api/cms/users/${loginBody.user.id}`, {
    headers,
    data: { role: 'admin' },
  })
  const me = await request.get('/api/cms/users/me', { headers })
  expect((await me.json()).user.role).toBe('editor')
  const anonymous = await page.request.get('/api/cms/legal-docs')
  expect((await anonymous.json()).docs).toEqual([])
  await page.goto('/admin/login')
  await page
    .getByRole('textbox', { name: 'Email *', exact: true })
    .fill('p3-editor@example.test')
  await page.getByLabel(/^Password/u).fill('P3-disposable-local-fixture-only!')
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await expect(
    page.getByRole('link', { name: 'Packages', exact: true }).first()
  ).toBeVisible()
})

test('admin manages users, editor edits drafts, anonymous cannot read or write them', async ({
  request,
}) => {
  async function auth(role: string) {
    const response = await request.post('/api/cms/users/login', {
      data: {
        email: `p3-${role}@example.test`,
        password: 'P3-disposable-local-fixture-only!',
      },
    })
    expect(response.ok()).toBe(true)
    return { Authorization: `JWT ${(await response.json()).token}` }
  }
  const admin = await auth('admin')
  const editor = await auth('editor')
  const created = await request.post('/api/cms/faqs', {
    headers: editor,
    data: {
      question: 'Private review draft',
      answer: 'Not yet public.',
      category: 'process',
      order: 99,
      _status: 'draft',
    },
  })
  expect(created.ok()).toBe(true)
  const { doc } = await created.json()
  try {
    expect((await request.get(`/api/cms/faqs/${doc.id}`)).ok()).toBe(false)
    expect(
      (
        await request.get(`/api/cms/faqs/${doc.id}?draft=true`, {
          headers: editor,
        })
      ).ok()
    ).toBe(true)
    expect(
      (
        await request.patch(`/api/cms/faqs/${doc.id}`, {
          data: { answer: 'Anonymous edit' },
        })
      ).ok()
    ).toBe(false)
    expect(
      (
        await request.delete(`/api/cms/faqs/${doc.id}`, { headers: editor })
      ).ok()
    ).toBe(false)
    expect(
      (
        await request.post('/api/cms/users', {
          headers: editor,
          data: {
            email: 'forbidden@example.test',
            password: 'Review-only-long-password',
          },
        })
      ).ok()
    ).toBe(false)
  } finally {
    expect(
      (await request.delete(`/api/cms/faqs/${doc.id}`, { headers: admin })).ok()
    ).toBe(true)
  }
})

test('published settings invalidate static contact and package content', async ({
  request,
}) => {
  const login = await request.post('/api/cms/users/login', {
    data: {
      email: 'p3-editor@example.test',
      password: 'P3-disposable-local-fixture-only!',
    },
  })
  const headers = { Authorization: `JWT ${(await login.json()).token}` }
  const original = await (
    await request.get('/api/cms/globals/site-settings', { headers })
  ).json()
  const consentText = 'HONEST review consent, refreshed without a rebuild.'
  try {
    const changed = await request.post('/api/cms/globals/site-settings', {
      headers,
      data: {
        consentTexts: { ...original.consentTexts, email: consentText },
        toolCostDisclosure: 'Review disclosure refreshed without a rebuild.',
      },
    })
    expect(changed.ok()).toBe(true)
    await expect
      .poll(async () => (await request.get('/contact')).text())
      .toContain(consentText)
    await expect
      .poll(async () => (await request.get('/packages')).text())
      .toContain('Review disclosure refreshed without a rebuild.')
  } finally {
    await request.post('/api/cms/globals/site-settings', {
      headers,
      data: {
        consentTexts: original.consentTexts,
        toolCostDisclosure: original.toolCostDisclosure,
      },
    })
  }
})
