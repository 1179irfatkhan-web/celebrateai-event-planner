import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

test('authenticated planner surfaces have no serious axe violations', async ({ page }) => {
  test.skip(!email || !password, 'Set E2E_EMAIL and E2E_PASSWORD for an isolated confirmed test user.')
  await page.goto('/login')
  await page.getByLabel('Email').fill(email!)
  await page.getByLabel('Password').fill(password!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page.getByText('Live workspace')).toBeVisible()
  const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze()
  expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))).toEqual([])
})
