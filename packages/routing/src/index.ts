export type { Coords, RouteResult, RoutingService } from "./types"
export { RoutingError } from "./types"

export type RoutingProvider = "ors" | "google"

export function createRoutingService(provider: RoutingProvider = "ors", apiKey?: string) {
  switch (provider) {
    case "ors":
      return import("./ors").then((m) => m.createOrsService(apiKey))
    case "google":
      return import("./google").then((m) => m.createGoogleService(apiKey))
    default:
      throw new Error(`Unknown routing provider: ${provider}`)
  }
}
