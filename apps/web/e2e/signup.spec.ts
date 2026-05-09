import { test, expect } from '@playwright/test'

test.describe('Signup page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup')
  })

  test('has no horizontal overflow', async ({ page }) => {
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(page.viewportSize()!.width)
  })

  test('form fields and submit button are visible', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/username/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()
  })

  test('has a link to the login page', async ({ page }) => {
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
  })

  test('successful signup navigates to /drive', async ({ page }) => {
    await page.route('**/v1/auth/register', (route) =>
      route.fulfill({ json: { accessToken: 'test-token' } })
    )
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

    await page.getByLabel(/email/i).fill('alice@example.com')
    await page.getByLabel(/username/i).fill('alice')
    await page.getByLabel(/password/i).fill('secret123')
    await page.getByRole('button', { name: /create account/i }).click()

    await expect(page).toHaveURL('/drive')
  })

  test('shows error message when registration fails', async ({ page }) => {
    await page.route('**/v1/auth/register', (route) =>
      route.fulfill({ status: 400, json: { message: 'Email already registered' } }),
    )

    await page.getByLabel(/email/i).fill('taken@example.com')
    await page.getByLabel(/username/i).fill('taken')
    await page.getByLabel(/password/i).fill('secret123')
    await page.getByRole('button', { name: /create account/i }).click()

    await expect(page.getByText('Email already registered')).toBeVisible()
  })
})
