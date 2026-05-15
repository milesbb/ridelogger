# Web — Claude Context

Next.js 14 App Router frontend, deployed to Vercel.

## Key files

| File | Purpose |
|---|---|
| `src/context/AuthContext.tsx` | Single source of auth state. Provides `accessToken`, `isLoading`, `login()`, `register()`, `logout()`. |
| `src/lib/api/client.ts` | All API calls. Handles Bearer token injection and auto-refresh on 401. |
| `src/lib/api/types.ts` | Shared API response types (`Passenger`, `Location`, `AppSettings`, etc.). |
| `src/lib/drive-utils.ts` | Pure calculation functions (`calculateRoundTrip`, `sumResults`). |

## Addresses

All addresses in this app are stored as `locations` rows on the API. Any form or component that saves an address must go through the locations API or the specific resource API (e.g. `api.passengers.create` creates the location server-side). Never send raw address strings to endpoints that don't own location creation.

## Component structure

- **Split UI into focused components.** A page file (`page.tsx`) handles data fetching and routing only. Visual sections go into named child components in the same directory.
- Each component does one thing. If a component is handling both data and rendering, or two unrelated pieces of UI, split it.
- Keep components short and readable — if you need to scroll to understand a component, it should be split further.
- Name components after what they display or what they do, not where they live (`PassengerForm`, not `Form`).

## Rules

- **All API calls go through `api.*` in `lib/api/client.ts`.** Never call `fetch` directly from a component or page.
- **Auth state comes from `useAuth()`.** Never read or write `sessionStorage` directly in components.
- Pages under `app/` that need auth should check `accessToken` from `useAuth()` and redirect if null.
- Use shadcn/ui components from `components/ui/` before writing custom UI elements.
- Tailwind only for styling — no CSS modules, no inline style objects.

## Responsive design — non-negotiable rules

**Every UI must work on mobile (all screen sizes) and laptop. There are no exceptions.**

- Design mobile-first. Apply Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) to scale up to larger screens, not the reverse.
- No layout, interaction, or content may be inaccessible or broken at any screen width.
- Touch targets must be tappable on mobile — minimum 44×44px.
- Never rely on hover-only interactions. Every action must be reachable by touch.
- Before marking any UI task complete, verify it at a narrow mobile viewport and a typical laptop viewport.

## Privacy policy

The source of truth for the privacy policy is `PRIVACY_POLICY.md` at the repo root. The page at `src/app/privacy/page.tsx` must always reflect it exactly.

**Whenever `PRIVACY_POLICY.md` is edited, you must also update `src/app/privacy/page.tsx` to match.** This is not optional — both files must stay in sync. The page renders the policy as React components; update the content, structure, dates, and any linked URLs to match the markdown source.

## Adding a new page

1. Create `src/app/<route>/page.tsx` as a client component (`"use client"`) if it needs auth or interactivity.
2. Use `useAuth()` for the access token.
3. Call `api.*` for data — handle loading and error states.
4. Add the API method to `lib/api/client.ts` and the type to `lib/api/types.ts` if needed.

## Auth flow

- On load: `AuthProvider` checks sessionStorage for a token, then falls back to `api.auth.refresh()` (uses httpOnly cookie).
- `login()` / `register()`: calls API, stores token in sessionStorage via `setToken()`, updates context state.
- `logout()`: clears token, calls API logout, redirects to `/login`.
- `apiFetch` in `client.ts` automatically retries with a refreshed token on a 401 response.

## Tests

- **After any change to a component or utility, update or add tests.** A change with no test update is incomplete unless it is purely cosmetic.
- Use Vitest + React Testing Library for all tests. Run `npm test` from `apps/web` to verify.
- **Components:** mock `@/lib/api/client` with `vi.mock`, render with `render()`, interact with `fireEvent`/`userEvent`, assert with `screen` queries. Follow the patterns in `passenger-form.test.tsx` and `drive-planner.test.tsx`.
- **Utilities:** plain Vitest unit tests — no rendering needed. Follow `drive-utils.test.ts`.
- Mock at the component boundary: mock `api.*` calls and `next/navigation`, not internal component state.
- Test user-facing behaviour: what renders, what API calls are triggered, what callbacks fire. Not internal state changes.
- Place test files next to the file they test (e.g. `passenger-form.tsx` → `passenger-form.test.tsx`).
