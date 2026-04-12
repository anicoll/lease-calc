import { test, expect } from '@playwright/test'

// Termination date defaults to today which would break the snapshot daily.
// Pin it to a fixed date.
const TERMINATION_DATE = '2026-04-01'

test('termination results panel matches golden snapshot', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Early Termination' }).click()
  await page.locator('input[type="date"]').fill(TERMINATION_DATE)
  await page.locator('button[type="submit"]').click()

  const panel = page.locator('#pdf-termination-results')
  await expect(panel).toBeVisible()

  await expect(panel).toHaveScreenshot('termination-results.png')
})

test('termination Download PDF button triggers a file download without errors', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Early Termination' }).click()
  await page.locator('input[type="date"]').fill(TERMINATION_DATE)
  await page.locator('button[type="submit"]').click()
  await expect(page.locator('#pdf-termination-results')).toBeVisible()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Download PDF/i }).click(),
  ])

  expect(download.suggestedFilename()).toBe('early-termination.pdf')

  await expect(page.getByRole('button', { name: /Download PDF/i })).toBeEnabled()
})
