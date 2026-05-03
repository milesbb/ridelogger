# RideLogger

A web app for volunteer drivers. Save passenger profiles and named locations, plan a drive day in minutes, and get a ready-to-copy table of distances and travel times for your paper form.

## How it works

Jo drives elderly passengers to appointments. Before heading out she:
1. Opens the app on her phone
2. Selects the passengers she's driving that day
3. Picks a destination for each from her saved locations (or adds a new one)
4. Taps **Calculate** — the app fetches driving distance and duration for each passenger's round trip
5. Copies the numbers onto her paper form

## Tech stack

| Layer | Choice |
|---|---|
| Monorepo | Turborepo + npm workspaces |
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Database + Auth | Supabase (PostgreSQL + magic link auth) |
| Routing API | OpenRouteService (abstracted — swap providers in `packages/routing`) |
| Deployment | Vercel |
| CI/CD | GitHub Actions (tests must pass before deploy) |
| Testing | Vitest |

## Prerequisites

- Node >= 18
- npm >= 9
- A free [Supabase](https://supabase.com) project
- A free [OpenRouteService](https://openrouteservice.org) API key
- A [Vercel](https://vercel.com) account (for deployment)

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp apps/web/.env.example apps/web/.env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, and ORS_API_KEY

# 3. Run database migrations (requires Supabase CLI)
npx supabase db push

# 4. Start the dev server
npm run dev
```

The app will be at `http://localhost:3000`.

## Running tests

```bash
# Run all tests once (across all packages)
npm run test

# Watch mode for a specific package
cd packages/routing && npm run test:watch
cd apps/web && npm run test:watch
```

## Adding a new routing provider

1. Create `packages/routing/src/<provider>.ts` implementing `RoutingService`
2. Add a new case in `packages/routing/src/index.ts` `createRoutingService()`
3. Set `ROUTING_PROVIDER=<provider>` in your `.env.local`

See [packages/routing/src/ors.ts](packages/routing/src/ors.ts) as a reference implementation.

## CI/CD

Every push to `main` runs:
1. `npm run test` (all Vitest suites via Turborepo)
2. If tests pass → deploy to Vercel production
3. If tests fail → deploy is blocked

Required GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.  
See [Vercel docs](https://vercel.com/docs/cli) for how to obtain these.

## Project structure

```
ridelogger/
├── apps/
│   └── web/              # Next.js app
│       ├── src/app/      # App Router pages
│       ├── src/components/
│       └── src/lib/
├── packages/
│   └── routing/          # Pluggable routing service
│       └── src/
├── .github/workflows/    # CI/CD
└── README.md
```
