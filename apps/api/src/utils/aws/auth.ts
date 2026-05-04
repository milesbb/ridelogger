import { getSecureParameter } from './parameters'

export async function getJWTSecret(): Promise<string> {
  return getSecureParameter(process.env.JWT_SECRET!)
}

export async function getOrsApiKey(): Promise<string> {
  return getSecureParameter(process.env.ORS_API_KEY!)
}
