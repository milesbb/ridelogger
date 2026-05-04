# RideLogger

Web app for volunteer drivers. Save passenger profiles and named locations, plan a drive day, and get a table of distances and times to copy onto your paper form.

## Stack

| Layer | Choice |
|---|---|
| Monorepo | Turborepo + npm workspaces |
| Frontend | Next.js 14 (App Router), Tailwind, shadcn/ui |
| Backend | Express.js on AWS Lambda |
| Database | Supabase PostgreSQL |
| Migrations | Flyway |
| Routing API | OpenRouteService (swap providers in `packages/routing/`) |
| Auth | JWT — 15 min access token + 30 day refresh token (httpOnly cookie) |
| CI/CD | GitHub Actions (path-triggered, lint + test gate deploy) |

## Local setup

**Prerequisites:** Node ≥ 18, npm ≥ 9, an [ORS API key](https://openrouteservice.org), a Postgres database (Supabase free tier works).

```bash
# 1. Install
npm install

# 2. API env vars
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — fill in DATABASE_URL, ORS_API_KEY, JWT_SECRET

# 3. Web env vars
cp apps/web/.env.example apps/web/.env.local
# NEXT_PUBLIC_API_URL is already set to http://localhost:4000

# 4. Run DB migrations (Docker required)
docker run --rm -v $(pwd)/db/migrations:/flyway/sql \
  flyway/flyway:10-alpine \
  -url="jdbc:postgresql://<host>:<port>/<db>" \
  -user="<user>" -password="<pass>" migrate

# 5. Start dev servers (web :3000, API :4000)
npm run dev
```

## DB migrations

Migrations live in `db/migrations/` and follow Flyway naming: `V1__description.sql`, `V2__description.sql`, etc.

**To add a migration:** create `db/migrations/V<next>__<description>.sql` and commit it. CI runs Flyway automatically before deploying the API.

**To run locally** (see step 4 above, or use the Flyway CLI if you have Java installed).

## Tests

```bash
npm test           # run all tests
npm run test:watch # watch mode (run from apps/web or packages/routing)
```

## CI/CD

Two workflows, each triggered only when their relevant paths change:

| Workflow | Triggers on | Jobs |
|---|---|---|
| `api.yml` | `apps/api/**`, `packages/**` | lint → test → migrate → deploy to Lambda |
| `web.yml` | `apps/web/**`, `packages/**` | lint → test → deploy to Vercel |

Deploy only runs on push to `main`. PRs run lint + test only.

**Required GitHub secrets:**

| Secret | Used by |
|---|---|
| `AWS_ACCESS_KEY_ID` | api.yml |
| `AWS_SECRET_ACCESS_KEY` | api.yml |
| `AWS_REGION` | api.yml |
| `VERCEL_TOKEN` | web.yml |
| `VERCEL_ORG_ID` | web.yml |
| `VERCEL_PROJECT_ID` | web.yml |

## SSM Parameter Store

All production secrets are stored in AWS SSM Parameter Store. These must exist before the first CI deploy. Create them in the AWS Console or with `aws ssm put-parameter`.

| Parameter | Type | Description |
|---|---|---|
| `/ridelogger/production/database-url` | SecureString | `postgresql://user:pass@host:5432/db` — for the API |
| `/ridelogger/production/flyway-url` | String | `jdbc:postgresql://host:5432/db` — for Flyway in CI |
| `/ridelogger/production/database-user` | String | DB username |
| `/ridelogger/production/database-password` | SecureString | DB password |
| `/ridelogger/production/jwt-secret` | SecureString | `openssl rand -hex 64` |
| `/ridelogger/production/ors-api-key` | SecureString | From openrouteservice.org |

## Swapping the routing provider

1. Create `packages/routing/src/<provider>.ts` implementing `RoutingService`
2. Add a case in `packages/routing/src/index.ts`
3. Update `ROUTING_PROVIDER` env var

See `packages/routing/src/ors.ts` as a reference.
