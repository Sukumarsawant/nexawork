import { test, expect } from './fixtures.mjs'

const password = process.env.E2E_PASSWORD || 'NexaworkDemo123!'
const studentA = process.env.E2E_STUDENT_A_EMAIL || 'student-a@nexawork.test'
const studentB = process.env.E2E_STUDENT_B_EMAIL || 'student-b@nexawork.test'
const business = process.env.E2E_BUSINESS_EMAIL || 'business@nexawork.test'

async function signIn(page, email, role = 'student') {
  await page.goto('/login')
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/${role}/dashboard$`))
}
async function signOut(page, role = 'student') {
  await page.goto(`/${role}/profile`)
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page.getByLabel('Email address')).toBeVisible()
}

test('two accounts persist a post, one like, and a comment across reload', async ({ page }) => {
  await signIn(page, studentA)
  const update = `Synthetic browser test ${Date.now()}`
  await page.getByLabel('What would you like to share?').fill(update)
  await page.getByRole('button', { name: 'Post', exact: true }).click()
  await expect(page.getByText(update, { exact: true })).toBeVisible()
  await signOut(page)
  await signIn(page, studentB)
  const article = page.getByRole('article').filter({ hasText: update })
  await article.getByRole('button', { name: /^Like/ }).click()
  await expect(article.getByRole('button', { name: /^Liked/ })).toHaveAttribute('aria-pressed', 'true')
  await article.getByRole('button', { name: /^Comment/ }).click()
  await article.getByLabel('Add a comment').fill('Synthetic persisted discussion')
  await article.getByRole('button', { name: 'Comment', exact: true }).last().click()
  await expect(article.getByText('Synthetic persisted discussion', { exact: true })).toBeVisible()
  await page.reload()
  const saved = page.getByRole('article').filter({ hasText: update })
  await expect(saved.getByRole('button', { name: /^Liked/ })).toHaveAttribute('aria-pressed', 'true')
  await saved.getByRole('button', { name: /^Comment/ }).click()
  await expect(saved.getByText('Synthetic persisted discussion', { exact: true })).toBeVisible()
  await signOut(page)
})

test('business sessions restore to business routes and cannot open the student feed', async ({ page }) => {
  await signIn(page, business, 'business')
  await page.goto('/login')
  await expect(page).toHaveURL(/\/business\/dashboard$/)
  await page.goto('/student/dashboard')
  await expect(page.getByRole('link', { name: 'Open my workspace' })).toBeVisible()
  await page.getByRole('link', { name: 'Open my workspace' }).click()
  await expect(page).toHaveURL(/\/business\/dashboard$/)
  await signOut(page, 'business')
})

test('phone navigation keeps valid destinations without horizontal overflow', async ({ page }) => {
  test.skip(Boolean(process.env.E2E_CDP_URL), 'Do not resize the shared desktop browser. Check the current desktop size manually.')
  await page.setViewportSize({ width: 390, height: 844 })
  await signIn(page, studentA)
  const navigation = page.getByRole('navigation', { name: 'Student navigation' })
  await navigation.getByRole('link', { name: 'Community', exact: true }).filter({ visible: true }).click()
  await expect(page).toHaveURL(/\/student\/community$/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await signOut(page)
})
