# API — Claude Context

Express.js app deployed as AWS Lambda via `@vendia/serverless-express`. Entry points: `src/lambda.ts` (production), `src/app-local.ts` (local dev with dotenv).

## Layer responsibilities

| Layer | Files | Rule |
|---|---|---|
| Controllers | `src/controllers/` | HTTP parsing + response only. No business logic. |
| Services | `src/service/` | Orchestrate data + external calls. No SQL, no HTTP primitives. |
| Data | `src/data/` | Raw SQL via `query()`/`queryOne()` from `utils/connections`. One file per DB table. |
| Utils | `src/utils/` | Shared plumbing — never import from controllers or services. |

## Secrets pattern

In production, env vars hold **SSM parameter paths**, not actual values. The Lambda fetches secrets at runtime on first use, then caches them for the lifetime of the warm container.

```
process.env.DB_URI_PARAM  →  "/ridelogger/production/database-uri"
                          →  getSecureParameter("/ridelogger/production/database-uri")
                          →  "postgresql://user:pass@host:5432/db"
```

In local dev (`NODE_ENV !== 'production'`), `DATABASE_URL`, `JWT_SECRET`, and `ORS_API_KEY` are read directly from `.env`.

## Addresses

All addresses live in the `locations` table. No other table stores `address`, `lat`, or `lon` columns — they store a `location_id` FK instead. When a service operation involves saving an address, it must create or update a `locations` row and use that row's `id` as the FK. See `service/passengers.ts` and `service/settings.ts` for the pattern.

## Adding a new endpoint

1. Add data function(s) in `src/data/<table>.ts` — plain SQL, typed return.
2. Add service function(s) in `src/service/<domain>.ts` — call data, call geocode if needed, throw `Errors.*` for domain failures.
3. Add route handler in `src/controllers/<domain>.ts` — validate body, call service, `res.json()`.
4. Mount the router in `src/app.ts` if it's a new controller file.
5. Add tests — service test mocks data layer, controller test mocks service layer.

## Tests

**Always update and add tests when changing service or data logic.** Every new service or data function needs a test. Every changed function needs its existing tests updated. A service- or data-layer change with no corresponding test change is incomplete.

Tests live alongside the source file (`foo.ts` → `foo.test.ts`). Run `vitest` from the `apps/api` directory to verify.

## DB migrations

Add `db/migrations/V<next>__<description>.sql`. Flyway applies them in order on every CI deploy. Never modify an existing migration file.

## Build

Webpack bundles `src/lambda.ts` to `dist/lambda.js`, then zips to `dist/api.zip`. The zip is uploaded to S3 and deployed via CloudFormation.
