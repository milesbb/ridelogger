# UI Testing — Spike findings

## Current state

**Stack already in place:** Vitest 1.6, @testing-library/react 16, happy-dom 15, @testing-library/jest-dom 6, @vitejs/plugin-react.

**What's tested today (5 files):**
- `src/context/AuthContext.test.tsx` — auth context: init, login, register, logout, 401 refresh
- `src/__tests__/drive-utils.test.ts` — pure functions: `calculateRoundTrip`, `sumResults`
- `src/lib/api/client.test.ts` — api client basics
- `src/app/login/page.test.tsx` — login form: render, submit, error, redirect, loading state
- `src/app/signup/page.test.tsx` — signup form

**Gaps:** No tests for any of the four main feature components — `DrivePlanner`, `PassengerForm`, `PassengersList`, `DriveDaysList` — and no modal/dialog interaction tests or page-level data-loading tests.

---

## Option A — Expand RTL component tests

**How it works:** Render components in happy-dom with `vi.mock()` over `@/lib/api/client` and `@/context/AuthContext`. Interact via `fireEvent`/`userEvent`, assert on the DOM via `screen` queries.

The pattern is already established in `src/app/login/page.test.tsx`:

```ts
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ login: mockLogin }) }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))

render(<LoginPage />)
fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jo' } })
fireEvent.submit(screen.getByRole('button').closest('form')!)
await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/drive'))
```

**What it can test:**
- Conditional rendering — e.g. PassengerForm's three home-address sections (none / edit / switch)
- Slot add / remove / reorder in DrivePlanner
- Search filter narrowing the list in PassengersList
- Modal open/close state (delete confirmation dialog)
- API call triggered correctly on form submit
- Error message displayed when API rejects
- Button disabled while async call is in flight
- `onDone` / `onRefresh` callback fired after success

**What it cannot test:**
- Real Next.js routing — `useRouter` is mocked, not executed
- `useEffect` data-fetching on page mount when the page wrapper is omitted
- CSS layout or responsive breakpoints
- Multi-page flows that cross route boundaries

**Effort to start:** Zero config changes needed — write test files alongside components, follow the existing pattern.

**Priority test targets:**

| Priority | File | What to test |
|---|---|---|
| 1 | `src/app/drive/DrivePlanner.test.tsx` | Slot add/remove/reorder, leg calculation triggered, save flow, error display |
| 2 | `src/app/passengers/PassengerForm.test.tsx` | Create vs edit mode, three home-address sections, location lazy-load on switch |
| 3 | `src/app/passengers/PassengersList.test.tsx` | Search filter, delete confirmation dialog, refresh callback |
| 4 | `src/app/drive-days/DriveDaysList.test.tsx` | Date grouping, modal detail view, km/min toggle |

---

## Option B — Playwright E2E with mocked network

**How it works:** Playwright drives a real Chromium browser against the Next.js dev server (started automatically via `webServer` in `playwright.config.ts`). API calls are intercepted with `page.route()` to return fixture JSON — no real backend or DB required.

```ts
await page.route('**/api/auth/refresh', route =>
  route.fulfill({ json: { accessToken: 'fake-token' } })
)
await page.route('**/api/passengers', route =>
  route.fulfill({ json: [{ id: 1, name: 'Alice', ... }] })
)
await page.goto('/drive')
await expect(page.getByText('Alice')).toBeVisible()
```

**What it can test that RTL cannot:**
- Full page lifecycle: load → auth check → redirect → data render
- Real navigation between routes (`/drive` → `/drive-days`)
- shadcn/ui Radix Dialogs and Selects, which use DOM portals that confuse happy-dom
- Keyboard navigation and focus trapping inside modals
- Responsive layout at specific viewports via `page.setViewportSize()`
- Multi-step flows: add passenger → appears in drive planner → save → appears in drive log

**Setup steps if we proceed:**

1. `npm install -D @playwright/test` inside `apps/web`
2. `npx playwright install chromium`
3. Add `playwright.config.ts`:
   ```ts
   import { defineConfig } from '@playwright/test'
   export default defineConfig({
     testDir: './e2e',
     webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true },
     use: { baseURL: 'http://localhost:3000' },
   })
   ```
4. Add `"test:e2e": "playwright test"` to `package.json`
5. Write `e2e/fixtures.ts` — typed helpers that return mock API responses
6. Write first test: login → drive page → add passenger slot

**Trade-offs vs RTL:**

| | RTL + happy-dom | Playwright + mocked network |
|---|---|---|
| Speed | ~50 ms / test | ~1–3 s / test |
| Setup cost | Zero (already done) | Install playwright + chromium (~200 MB), write config + fixture layer |
| Maintenance | Low — `vi.fn()` mocks are cheap | Medium — `page.route()` fixtures need updating when API response shapes change |
| Confidence | Component logic in isolation | Full browser rendering, real DOM events, real CSS applied |
| CI overhead | Node only | Chromium binary, dev server startup |
| Radix/shadcn dialogs | Unreliable in happy-dom | Work correctly |
| Mobile viewport tests | No | Yes — `page.setViewportSize({ width: 390, height: 844 })` |

---

## Recommendation

**Start with RTL component tests (Option A).** Zero config cost, high ROI on the complex components that currently have no coverage. The existing login page tests confirm the pattern is fast to write and catches real bugs (error display, loading state, callback firing).

**Add Playwright later, once RTL coverage is solid.** The main triggers to reach for Playwright:

- A test needs to interact with a Radix Dialog or Select and happy-dom behaves incorrectly
- A mobile-layout regression needs to be caught reliably
- A multi-page flow (add passenger → plan drive → view log) is worth pinning as a smoke test

**Practical next step:** write RTL tests for `DrivePlanner` and `PassengerForm`. If either hits happy-dom limitations with Radix portals, that's the concrete signal to set up Playwright for those cases.
