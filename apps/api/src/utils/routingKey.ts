import { type RoutingProvider } from "@ridelogger/routing"
import { getOrsApiKey, getGoogleApiKey } from "./aws/auth"

let cachedOrsKey: string | null = null
let cachedGoogleKey: string | null = null

export async function getRoutingApiKey(provider: RoutingProvider): Promise<string | undefined> {
  if (process.env.NODE_ENV !== "production") {
    return provider === "google" ? process.env.GOOGLE_MAPS_API_KEY : process.env.ORS_API_KEY
  }
  if (provider === "google") {
    if (!cachedGoogleKey) cachedGoogleKey = await getGoogleApiKey()
    return cachedGoogleKey
  }
  if (!cachedOrsKey) cachedOrsKey = await getOrsApiKey()
  return cachedOrsKey
}

export function getRoutingProvider(): RoutingProvider {
  return (process.env.ROUTING_PROVIDER as RoutingProvider) ?? "ors"
}
