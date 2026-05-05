import type { Coords, RouteResult, RoutingService } from "./types";
import { RoutingError } from "./types";

const ORS_BASE = "https://api.heigit.org";

export function createOrsService(apiKey?: string): RoutingService {
  const key = apiKey ?? process.env.ORS_API_KEY;
  if (!key) throw new RoutingError("ORS_API_KEY is not set");

  return {
    async geocode(address: string): Promise<Coords> {
      const url = `${ORS_BASE}/geocode/search?api_key=${key}&text=${encodeURIComponent(address)}&boundary.country=AU,NZ&size=1`;
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new RoutingError(
          `ORS geocode failed: ${res.statusText} — ${body}`,
          res.status,
        );
      }
      const data = (await res.json()) as {
        features?: { geometry: { coordinates: [number, number] } }[];
      };
      const feature = data?.features?.[0];
      if (!feature) throw new RoutingError(`No geocode result for: ${address}`);
      const [lon, lat] = feature.geometry.coordinates as [number, number];
      return { lat, lon };
    },

    async getRoute(from: Coords, to: Coords): Promise<RouteResult> {
      const url = `${ORS_BASE}/v2/directions/driving-car`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates: [
            [from.lon, from.lat],
            [to.lon, to.lat],
          ],
        }),
      });
      if (!res.ok) {
        throw new RoutingError(
          `ORS directions failed: ${res.statusText}`,
          res.status,
        );
      }
      const data = (await res.json()) as {
        routes?: { summary: { distance: number; duration: number } }[];
      };
      const summary = data?.routes?.[0]?.summary;
      if (!summary) throw new RoutingError("No route found");
      return {
        distanceKm: Math.round((summary.distance / 1000) * 10) / 10,
        durationMin: Math.round(summary.duration / 60),
      };
    },
  };
}
