import { expect, test } from '@playwright/test'
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
