import { createRoutingService, type Coords } from "@ridelogger/routing"
import { Errors } from "../utils/errorTypes"
import logger from "../utils/logging"
import { getRoutingApiKey, getRoutingProvider } from "../utils/routingKey"

export async function geocodeAddress(address: string): Promise<Coords> {
  const provider = getRoutingProvider()
  const apiKey = await getRoutingApiKey(provider)
  const routing = await createRoutingService(provider, apiKey, logger)
  try {
    return await routing.geocode(address)
  } catch (err) {
    logger.error("Geocode failed", {
      address,
      error: err instanceof Error ? err.message : String(err),
    })
    throw Errors.BadRequest("Could not geocode that address — please check it and try again.")
  }
}
