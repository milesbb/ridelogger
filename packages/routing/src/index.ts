export type { Coords, Logger, RouteResult, RoutingService } from "./types"
export { RoutingError } from "./types"

export type RoutingProvider = "ors" | "google"

import type { Logger } from "./types"

export function createRoutingService(provider: RoutingProvider = "ors", apiKey?: string, logger?: Logger) {
  switch (provider) {
    case "ors":
      return import("./ors").then((m) => m.createOrsService(apiKey, logger))
    case "google":
      return import("./google").then((m) => m.createGoogleService(apiKey, logger))
    default:
      throw new Error(`Unknown routing provider: ${provider}`)
  }
}
