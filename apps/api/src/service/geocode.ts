import { createRoutingService, type Coords } from "@ridelogger/routing"
import { Errors } from "../utils/errorTypes"

export async function geocodeAddress(address: string): Promise<Coords> {
  const provider = (process.env.ROUTING_PROVIDER as "ors" | "google") ?? "ors"
  const routing = await createRoutingService(provider)
  try {
    return await routing.geocode(address)
  } catch {
    throw Errors.BadRequest(
      "Could not geocode that address — please check it and try again.",
    )
  }
}
