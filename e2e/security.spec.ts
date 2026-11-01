import { test, expect } from '@playwright/test'

const userA = { email: process.env.E2E_USER_A_EMAIL, password: process.env.E2E_USER_A_PASSWORD }
const userB = { email: process.env.E2E_USER_B_EMAIL, password: process.env.E2E_USER_B_PASSWORD }

test('two independent users cannot see each other’s planner data', async ({ browser }) => {
  test.skip(!userA.email || !userA.password || !userB.email || !userB.password, 'Set isolated confirmed E2E_USER_A/B credentials for this security test.')
  const contextA = await browser.newContext()
  const contextB = await browser.newContext()
  const pageA = await contextA.newPage()
  const pageB = await contextB.newPage()
  for (const [page, user] of [[pageA, userA], [pageB, userB]] as const) {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill(user.email!)
    await page.getByLabel('Password').fill(user.password!)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText('Live workspace')).toBeVisible()
  }
  await pageA.goto('/events')
  const privateEventName = `Security fixture ${Date.now()}`
  await pageA.getByLabel('New event name').fill(privateEventName)
  await pageA.getByRole('button', { name: 'Create event' }).click()
  await expect(pageA.getByText(privateEventName)).toBeVisible()
  await pageB.goto('/events')
  await expect(pageB.getByText(privateEventName)).not.toBeVisible()
  await contextA.close(); await contextB.close()
})
