# Web — Claude Context

Next.js 14 App Router frontend, deployed to Vercel.

## Key files

| File | Purpose |
|---|---|
| `src/context/AuthContext.tsx` | Single source of auth state. Provides `accessToken`, `isLoading`, `login()`, `register()`, `logout()`. |
| `src/lib/api/client.ts` | All API calls. Handles Bearer token injection and auto-refresh on 401. |
| `src/lib/api/types.ts` | Shared API response types (`Passenger`, `Location`, `AppSettings`, etc.). |
| `src/lib/drive-utils.ts` | Pure calculation functions (`calculateRoundTrip`, `sumResults`). |

## Rules

- **All API calls go through `api.*` in `lib/api/client.ts`.** Never call `fetch` directly from a component or page.
- **Auth state comes from `useAuth()`.** Never read or write `sessionStorage` directly in components.
- Pages under `app/` that need auth should check `accessToken` from `useAuth()` and redirect if null.
- Use shadcn/ui components from `components/ui/` before writing custom UI elements.
- Tailwind only for styling — no CSS modules, no inline style objects.

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
