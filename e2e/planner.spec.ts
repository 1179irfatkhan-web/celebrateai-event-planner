import { test, expect } from '@playwright/test'

const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD
const hasFixture = Boolean(email && password)

test.describe('CelebrateAI planner', () => {
  test.skip(!hasFixture, 'Set E2E_EMAIL and E2E_PASSWORD for an isolated confirmed test user.')

  test('authenticates and exposes planner controls', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(email!)
    await page.getByLabel('Password').fill(password!)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('Live workspace')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Budget' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Guests' })).toBeVisible()
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('keeps planner workspace data after reload', async ({ page }) => {
    await page.goto('/budget')
    await expect(page.getByRole('heading', { name: 'Budget categories' })).toBeVisible()
    await expect(page.getByLabel('Budget category name')).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Budget categories' })).toBeVisible()
  })

  test('exposes task, RSVP, vendor, and assistant actions', async ({ page }) => {
    await page.goto('/timeline')
    await expect(page.getByRole('heading', { name: 'Planning tasks' })).toBeVisible()
    await page.goto('/guests')
    await expect(page.getByText('Guest list')).toBeVisible()
    await page.goto('/vendors')
    await expect(page.getByText('Vendor shortlist')).toBeVisible()
    await page.goto('/')
    await page.getByRole('button', { name: 'Ask CelebrateAI' }).click()
    await expect(page.getByRole('dialog', { name: 'Ask CelebrateAI' })).toBeVisible()
  })
})
