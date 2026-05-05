import {
  createRoutingService,
  type Coords,
  type RoutingProvider,
} from "@ridelogger/routing";
import { getOrsApiKey, getGoogleApiKey } from "../utils/aws/auth";
import { Errors } from "../utils/errorTypes";
import logger from "../utils/logging";

let cachedOrsKey: string | null = null;
let cachedGoogleKey: string | null = null;

async function getApiKey(
  provider: RoutingProvider,
): Promise<string | undefined> {
  if (process.env.NODE_ENV !== "production") {
    return provider === "google"
      ? process.env.GOOGLE_MAPS_API_KEY
      : process.env.ORS_API_KEY;
  }
  if (provider === "google") {
    if (!cachedGoogleKey) cachedGoogleKey = await getGoogleApiKey();
    return cachedGoogleKey;
  }
  if (!cachedOrsKey) cachedOrsKey = await getOrsApiKey();
  return cachedOrsKey;
}

export async function geocodeAddress(address: string): Promise<Coords> {
  const provider = (process.env.ROUTING_PROVIDER as RoutingProvider) ?? "ors";
  const apiKey = await getApiKey(provider);
  const routing = await createRoutingService(provider, apiKey, logger);
  try {
    return await routing.geocode(address);
  } catch (err) {
    logger.error("Geocode failed", {
      address,
      error: err instanceof Error ? err.message : String(err),
    });
    throw Errors.BadRequest(
      "Could not geocode that address — please check it and try again.",
    );
  }
}
