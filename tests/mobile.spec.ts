import { test, expect } from '@playwright/test'

// Targeted mobile regression tests for v0.4 (comparison table) and v0.5 (FBT
// phase inputs). Runs against all device projects configured in playwright.config.ts.

test.describe('v0.4 – comparison table on mobile', () => {
  test('table container is configured for horizontal scroll', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Calculate' }).click()

    const container = page.locator('.overflow-x-auto').first()
    await expect(container).toBeVisible()

    // The container must be configured for horizontal scrolling regardless of viewport width.
    const overflowX = await container.evaluate(el => getComputedStyle(el).overflowX)
    expect(overflowX).toBe('auto')
  })

  test('table overflows container on mobile viewport', async ({ page, isMobile }) => {
    // Only meaningful on a phone-width viewport — skip on desktop.
    test.skip(!isMobile, 'horizontal overflow only expected on narrow mobile viewports')

    await page.goto('/')
    await page.getByRole('button', { name: 'Calculate' }).click()

    const container = page.locator('.overflow-x-auto').first()
    await expect(container).toBeVisible()

    const tableScrollWidth = await container.locator('table').evaluate(el => el.scrollWidth)
    const containerClientWidth = await container.evaluate(el => el.clientWidth)
    expect(tableScrollWidth).toBeGreaterThan(containerClientWidth)
  })

  test('row labels stay pinned to the left edge after horizontal scroll', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'sticky label test is only meaningful when the table actually overflows')

    await page.goto('/')
    await page.getByRole('button', { name: 'Calculate' }).click()

    const container = page.locator('.overflow-x-auto').first()
    await expect(container).toBeVisible()

    // Bring the container into the browser viewport before scrolling it.
    await container.evaluate(el => el.scrollIntoView({ block: 'center' }))

    // Scroll the table fully to the right.
    await container.evaluate(el => { el.scrollLeft = el.scrollWidth })

    // The sticky label should still be aligned with the container's left edge.
    const containerBox = await container.boundingBox()
    const firstLabel = container.locator('tbody tr').first().locator('td').first()
    const labelBox = await firstLabel.boundingBox()

    expect(labelBox).not.toBeNull()
    expect(containerBox).not.toBeNull()
    // Allow up to 8 px for border/padding — sticky left-0 keeps it at the container's left.
    expect(labelBox!.x).toBeLessThanOrEqual(containerBox!.x + 8)
  })

  test('all five term-year buttons are reachable and can be selected', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Calculate' }).click()

    for (const years of [1, 2, 3, 4, 5]) {
      const btn = page.getByRole('button', { name: `${years} ${years === 1 ? 'Year' : 'Years'}` })
      await btn.scrollIntoViewIfNeeded()
      await btn.click()
      await expect(btn).toHaveClass(/bg-blue-600/)
    }
  })

  test('selecting a term expands the full breakdown panel below the table', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Calculate' }).click()

    const btn = page.getByRole('button', { name: '3 Years' })
    await btn.scrollIntoViewIfNeeded()
    await btn.click()

    await expect(page.locator('#pdf-calculator-results')).toBeVisible()
  })
})

test.describe('v0.5 – FBT phase inputs on mobile', () => {
  test('lease start date input is visible and has adequate touch target height', async ({ page }) => {
    await page.goto('/')

    const dateInput = page.locator('input[type="date"]')
    await expect(dateInput).toBeVisible()

    const box = await dateInput.boundingBox()
    expect(box).not.toBeNull()
    // 36 px is the practical lower bound for a comfortable touch target.
    expect(box!.height).toBeGreaterThanOrEqual(36)
  })

  test('grandfathered-lease checkbox appears only for BEV and can be toggled', async ({ page }) => {
    await page.goto('/')

    // Default vehicle type is BEV — checkbox must be visible.
    const grandfatheredText = 'Lease entered into before 1 April 2027'
    await expect(page.getByText(grandfatheredText)).toBeVisible()

    // Switch to ICE — the checkbox must disappear.
    const vehicleTypeSelect = page.locator('select').nth(1)
    await vehicleTypeSelect.selectOption('ICE')
    await expect(page.getByText(grandfatheredText)).toBeHidden()

    // Switch back to BEV — checkbox reappears and can be tapped.
    await vehicleTypeSelect.selectOption('BEV')
    const gfLabel = page.locator('label').filter({ hasText: grandfatheredText })
    await expect(gfLabel).toBeVisible()
    await gfLabel.click()
    const gfCheckbox = gfLabel.locator('input[type="checkbox"]')
    await expect(gfCheckbox).toBeChecked()
  })

  test('FBT Exempt banner is visible and does not overflow after calculating a BEV under the threshold', async ({ page }) => {
    await page.goto('/')
    // Default inputs: BEV at $65,000, today's date → full exemption.
    await page.getByRole('button', { name: 'Calculate' }).click()

    const banner = page.locator('div').filter({ hasText: /FBT Exempt/ }).first()
    await banner.scrollIntoViewIfNeeded()
    await expect(banner).toBeVisible()

    // Confirm text is not clipped — scrollWidth must not exceed clientWidth.
    const overflows = await banner.evaluate(el => el.scrollWidth > el.clientWidth)
    expect(overflows).toBe(false)
  })

  test('Partial FBT Exemption banner shown for BEV in Phase 2 price range', async ({ page }) => {
    await page.goto('/')

    // Vehicle price $80,000 (between $75k and $91,387) + lease start in Phase 2.
    const numberInputs = page.locator('input[type="number"]')
    await numberInputs.nth(1).fill('80000')      // vehicle cost (second number input)
    await page.locator('input[type="date"]').fill('2027-06-01')

    await page.getByRole('button', { name: 'Calculate' }).click()

    const banner = page.locator('div').filter({ hasText: /Partial FBT Exemption/ }).first()
    await banner.scrollIntoViewIfNeeded()
    await expect(banner).toBeVisible()
  })

  test('phase-crossing warning appears when a Phase 2 lease runs into Phase 3', async ({ page }) => {
    await page.goto('/')

    // $80,000 BEV, lease starts 2027-06-01 (Phase 2). A 5-year term ends 2032-06-01,
    // crossing Phase 3 (starts 2029-04-01).
    const numberInputs = page.locator('input[type="number"]')
    await numberInputs.nth(1).fill('80000')
    await page.locator('input[type="date"]').fill('2027-06-01')

    await page.getByRole('button', { name: 'Calculate' }).click()

    const fiveYearBtn = page.getByRole('button', { name: '5 Years' })
    await fiveYearBtn.scrollIntoViewIfNeeded()
    await fiveYearBtn.click()

    // The warning text includes "Phase 3".
    const warning = page.getByText(/Phase 3/i)
    await warning.scrollIntoViewIfNeeded()
    await expect(warning).toBeVisible()
  })
})
