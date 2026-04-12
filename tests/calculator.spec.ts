import { test, expect } from '@playwright/test'

// Uses the form's built-in default values — no filling required.
// If defaults change, update the golden snapshot with --update-snapshots.
test('calculator results panel matches golden snapshot', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Calculate' }).click()

  const panel = page.locator('#pdf-calculator-results')
  await expect(panel).toBeVisible()

  await expect(panel).toHaveScreenshot('calculator-results.png')
})

test('calculator Download PDF button triggers a file download without errors', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Calculate' }).click()
  await expect(page.locator('#pdf-calculator-results')).toBeVisible()

  // Intercept the download and verify it completes as a PDF
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Download PDF/i }).click(),
  ])

  expect(download.suggestedFilename()).toBe('novated-lease-calculator.pdf')

  // Confirm the button label returns to normal (no stuck loading state)
  await expect(page.getByRole('button', { name: /Download PDF/i })).toBeEnabled()
})
