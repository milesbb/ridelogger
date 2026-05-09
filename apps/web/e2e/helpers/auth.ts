import type { Page } from '@playwright/test'

// Injects a fake token before React hydrates so AuthContext finds it in
// sessionStorage immediately and skips the refresh call.
export async function authenticatePage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    sessionStorage.setItem('accessToken', 'test-token')
  })
}

// Minimal API fixtures needed for the drive page to render without redirecting.
export async function mockDrivePageApi(
  page: Page,
  overrides: {
    passengers?: object[]
    locations?: object[]
  } = {},
): Promise<void> {
  const passengers = overrides.passengers ?? []
  const locations = overrides.locations ?? []

  await page.route('**/v1/passengers', (route) => route.fulfill({ json: passengers }))
  await page.route('**/v1/locations', (route) => route.fulfill({ json: locations }))
  await page.route('**/v1/settings', (route) =>
    route.fulfill({
      json: {
        id: 's1',
        user_id: 'u1',
        home_address: '1 Main St, Suburb VIC 3000',
        home_location_id: 'loc-home',
        home_lat: null,
        home_lon: null,
        created_at: '',
        updated_at: '',
      },
    }),
  )
}
