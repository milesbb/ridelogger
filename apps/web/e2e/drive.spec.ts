import { test, expect } from '@playwright/test'
import { authenticatePage, mockDrivePageApi } from './helpers/auth'

const alice = {
  id: 'p1',
  user_id: 'u1',
  name: 'Alice Smith',
  home_address: '1 Alice St, Suburb VIC 3000',
  home_location_id: 'loc-alice',
  home_lat: null,
  home_lon: null,
  notes: null,
  created_at: '',
  updated_at: '',
}

const aliceHomeLocation = {
  id: 'loc-alice',
  user_id: 'u1',
  name: "Alice's Home",
  address: '1 Alice St, Suburb VIC 3000',
  lat: null,
  lon: null,
  created_at: '',
  updated_at: '',
}

test.describe('Drive planner page', () => {
  test.beforeEach(async ({ page }) => {
    await authenticatePage(page)
    await mockDrivePageApi(page, {
      passengers: [alice],
      locations: [aliceHomeLocation],
    })
    await page.goto('/drive')
  })

  test('has no horizontal overflow', async ({ page }) => {
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(page.viewportSize()!.width)
  })

  test('passenger list and key controls are visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Alice Smith' })).toBeVisible()
    await expect(page.getByPlaceholder(/search passengers/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /new passenger/i })).toBeVisible()
  })

  test('add passenger button meets minimum touch target size', async ({ page }) => {
    const btn = page.getByRole('button', { name: /new passenger/i })
    const box = await btn.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  })

  test('adding a passenger shows them in trip order', async ({ page }) => {
    await page.getByRole('button', { name: 'Alice Smith' }).click()
    await expect(page.getByText('Trip order')).toBeVisible()
    await expect(page.getByText('Pick-up')).toBeVisible()
  })
})
