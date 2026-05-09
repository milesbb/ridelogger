import { test, expect } from '@playwright/test'

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('has no horizontal overflow', async ({ page }) => {
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(page.viewportSize()!.width)
  })

  test('form fields and submit button are visible', async ({ page }) => {
    await expect(page.getByLabel(/email or username/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('successful login navigates to /drive', async ({ page }) => {
    await page.route('**/v1/auth/login', async (route) => {
      await page.context().addCookies([{ name: 'refreshToken', value: 'fake-token', domain: 'localhost', path: '/', httpOnly: true }])
      await route.fulfill({ json: { accessToken: 'test-token' } })
    })
    await page.route('**/v1/passengers', (route) => route.fulfill({ json: [] }))
    await page.route('**/v1/locations', (route) => route.fulfill({ json: [] }))
    await page.route('**/v1/settings', (route) =>
      route.fulfill({
        json: {
          id: 's1',
          user_id: 'u1',
          home_address: '1 Main St',
          home_location_id: 'loc-home',
          home_lat: null,
          home_lon: null,
          created_at: '',
          updated_at: '',
        },
      }),
    )

    await page.getByLabel(/email or username/i).fill('alice')
    await page.getByLabel(/password/i).fill('secret')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL('/drive')
  })

  test('shows error message on bad credentials', async ({ page }) => {
    // 401 triggers the API client's token-refresh redirect — use 400 for bad credentials
    await page.route('**/v1/auth/login', (route) =>
      route.fulfill({ status: 400, json: { message: 'Invalid credentials' } }),
    )

    await page.getByLabel(/email or username/i).fill('alice')
    await page.getByLabel(/password/i).fill('wrong')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByText('Invalid credentials')).toBeVisible()
  })
})
