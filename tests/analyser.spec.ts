import { test, expect } from '@playwright/test'

test('analyser results panel matches golden snapshot', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Analyse My Lease' }).first().click()
  await page.locator('button[type="submit"]').click()

  const panel = page.locator('#pdf-analyser-results')
  await expect(panel).toBeVisible()

  await expect(panel).toHaveScreenshot('analyser-results.png')
})

test('analyser Download PDF button triggers a file download without errors', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Analyse My Lease' }).first().click()
  await page.locator('button[type="submit"]').click()
  await expect(page.locator('#pdf-analyser-results')).toBeVisible()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Download PDF/i }).click(),
  ])

  expect(download.suggestedFilename()).toBe('lease-analyser.pdf')

  await expect(page.getByRole('button', { name: /Download PDF/i })).toBeEnabled()
})
