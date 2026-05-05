# Routing package — Claude Context

Provider-agnostic routing abstraction. The rest of the codebase calls `createRoutingService()` and never imports from a specific provider file.

## Adding a provider

1. Create `src/<provider>.ts` implementing the `RoutingService` interface from `src/types.ts`.
2. Add a `case` for it in `createRoutingService()` in `src/index.ts`.
3. Set `ROUTING_PROVIDER=<provider>` in the API env.

The `ors.ts` implementation is the reference. Match its function signatures exactly.
