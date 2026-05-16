# RideLogger — Claude Context

## README

`README.md` is the developer setup guide for the whole repo. If your changes affect anything it documents — stack choices, env vars, SSM parameters, CI/CD behaviour, local setup steps, or repo structure — update `README.md` to match.

## What this is

Web app for volunteer drivers. Users save passenger profiles and named locations, plan a drive day, and get a distance/time table to copy onto their paper form. Auth is JWT-based (no Supabase auth). Routing is via OpenRouteService.

## Repo structure

```
apps/
  api/          Express.js API, deployed to AWS Lambda via @vendia/serverless-express
  web/          Next.js 14 (App Router) frontend, deployed to Vercel
packages/
  routing/      RoutingService abstraction — swap providers by adding a new file here
db/
  migrations/   Flyway SQL migrations (V1__, V2__, ...)
```

## Stack

| Layer | Choice |
|---|---|
| Monorepo | Turborepo + npm workspaces |
| Frontend | Next.js 14 App Router, Tailwind, shadcn/ui |
| Backend | Express on AWS Lambda (ap-southeast-2) |
| Database | PostgreSQL via raw `pg` + Flyway migrations |
| Auth | JWT — 15 min access token (sessionStorage) + 30 day refresh token (httpOnly cookie, bcrypt-hashed in DB) |
| Secrets | AWS SSM Parameter Store — env vars hold SSM paths, Lambda fetches values at runtime |
| Routing API | OpenRouteService (`packages/routing/`) |
| CI/CD | GitHub Actions → Lambda (api.yml) + Vercel (web.yml), path-triggered |

## Architecture — API

Three strict layers. Never skip or bypass them.

```
controllers/   HTTP only — parse request, call service, send response
service/       Business logic — orchestrates data + external calls
data/          DB only — raw SQL via pg, one file per table
utils/         Shared plumbing — connections, errors, logging, AWS
```

- Controllers call services. Services call data functions and external services. Data functions call the DB.
- `utils/connections.ts` — lazy `pg.Pool`, uses `DATABASE_URL` in dev and fetches from SSM in production.
- `utils/aws/parameters.ts` — `getSecureParameter(ssmPath)` wraps SSM. `getDatabaseParameters()` fetches all DB params in parallel.
- `utils/aws/auth.ts` — `getJWTSecret()`, `getOrsApiKey()` — SSM in production, env var in dev.
- `utils/logging.ts` — Winston JSON logger. Use it everywhere, never `console.log`.
- `utils/errorTypes.ts` — all errors go through `Errors.*` factory. Never throw plain strings.

## Architecture — Web

```
app/           Next.js App Router pages
components/    Shared UI components (shadcn/ui based)
context/       AuthContext — single source of auth state
lib/api/       client.ts — all API calls, handles token refresh on 401
lib/           drive-utils.ts and other pure utilities
```

- All API calls go through `api.*` in `lib/api/client.ts`. Never call `fetch` directly from a component.
- Auth state comes from `useAuth()`. Never read sessionStorage directly in components.

---

## UI/UX — non-negotiable rules

**Every UI must work on mobile (all screen sizes) and laptop. There are no exceptions.**

- Design mobile-first. Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) to layer up to larger screens.
- No layout, interaction, or content may be inaccessible or broken on any screen width.
- Touch targets must be large enough to tap on mobile (minimum 44×44px).
- Never rely on hover-only interactions — all actions must be reachable by touch.
- Test every UI change at both a narrow mobile viewport and a typical laptop viewport before marking work complete.

---

## Code style — non-negotiable rules

### Types

- **Always explicit types.** Every function parameter, return type, and variable that isn't trivially inferred must be typed.
- **Never use `any`.** If you think you need `any`, find the real type. The only acceptable exception is third-party library boundary issues where the correct type is genuinely unavailable.
- **Never use `unknown`** unless you are immediately narrowing it with a type guard in the next line.
- Use `interface` for object shapes, `type` for unions and aliases.
- Prefer specific types over broad ones — `string` over `unknown`, `User` over `Record<string, unknown>`.

### Functions

- **Small and single-purpose.** If a function does two things, split it.
- Maximum ~20 lines. If it's getting longer, extract named helpers.
- Name functions after what they return or what they do, not how they do it.
- Prefer `async/await` over promise chains.

### Implementation

- **Simple over clever.** The obvious implementation is correct until proven otherwise.
- No abstractions unless the same pattern appears in three or more places.
- No defensive coding for impossible cases. Trust TypeScript and internal invariants.
- No feature flags, backwards-compat shims, or speculative generality.
- Validate only at system boundaries (HTTP request bodies, external API responses).

### Comments

- No comments by default.
- Only add a comment when the **why** is non-obvious — a hidden constraint, a workaround, a subtle invariant. If you'd write "this does X", don't write it.

### Imports

- No barrel files (`index.ts` re-exports) except where the package boundary requires it.
- Import from the specific file, not a directory index.

### Addresses and locations

- **All addresses are stored as rows in the `locations` table.** Never add `address`, `lat`, or `lon` columns to any other table.
- Any table that needs to reference an address stores a `location_id` FK column pointing to `locations.id`.
- When creating a record that owns an address (e.g. a passenger), create the `locations` row first, then insert the parent record with the returned `location_id`.
- When updating an owned address, update the existing `locations` row in place (the FK stays the same).
- When switching which location a record references, update only the FK column.

### SQL (API data layer)

- Raw SQL only. No query builders, no ORMs.
- Column names in snake_case matching the DB schema exactly.
- Always SELECT only the columns you need (or `*` when returning a full row for a parse function).
- Use parameterised queries (`$1`, `$2`, ...) always. Never string-interpolate values.

### Error handling

- Use `Errors.*` from `utils/errorTypes.ts` for all application errors.
- Propagate errors up — don't swallow them silently.
- Only catch errors you intend to handle. Let others bubble to the Express error handler.
- Log at the point of origin with Winston when context is available, not in the error handler.

### Tests

- Vitest across all packages.
- Mock at the boundary of the layer under test. Service tests mock the data layer. Controller tests mock the service layer.
- No mocking of internal implementation details.
- Test behaviour, not implementation. Assert on what a function returns or what side effects it causes, not how it does it internally.
- **After any change to API service or data logic, update the relevant tests and add new tests for new behaviour.** A change with no test update is incomplete unless the change is purely cosmetic (renaming, reformatting) or only touches configuration.
- **After any change to a web component or utility, update or add the relevant RTL/Vitest tests.** See `apps/web/CLAUDE.md` for the web-specific testing rules.
- **Every web component test file must include an axe accessibility check** (`import { axe } from 'vitest-axe'`). When adding a new component, add `it('has no accessibility violations', ...)` as the first test in the first rendering describe block. See `apps/web/CLAUDE.md` for full axe testing rules.
