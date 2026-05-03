export interface Coords {
  lat: number
  lon: number
}

export interface RouteResult {
  distanceKm: number
  durationMin: number
}

export interface RoutingService {
  geocode(address: string): Promise<Coords>
  getRoute(from: Coords, to: Coords): Promise<RouteResult>
}

export class RoutingError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = "RoutingError"
  }
}
