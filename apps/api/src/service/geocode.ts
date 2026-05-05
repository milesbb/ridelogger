import { createRoutingService, type Coords } from '@ridelogger/routing'
import { getOrsApiKey } from '../utils/aws/auth'
import { Errors } from '../utils/errorTypes'
import logger from '../utils/logging'

let cachedOrsKey: string | null = null

async function getApiKey(): Promise<string | undefined> {
  if (process.env.NODE_ENV !== 'production') {
    return process.env.ORS_API_KEY
  }
  if (!cachedOrsKey) {
    cachedOrsKey = await getOrsApiKey()
  }
  return cachedOrsKey
}

export async function geocodeAddress(address: string): Promise<Coords> {
  const provider = (process.env.ROUTING_PROVIDER as 'ors' | 'google') ?? 'ors'
  const apiKey = await getApiKey()
  const routing = await createRoutingService(provider, apiKey)
  try {
    return await routing.geocode(address)
  } catch (err) {
    logger.error('Geocode failed', { address, err })
    throw Errors.BadRequest('Could not geocode that address — please check it and try again.')
  }
}
