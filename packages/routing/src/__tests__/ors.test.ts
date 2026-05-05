import { describe, it, expect, vi, beforeEach } from "vitest"
import { createOrsService } from "../ors"
import { RoutingError } from "../types"

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

beforeEach(() => {
  mockFetch.mockReset()
})

describe("createOrsService", () => {
  it("throws if no API key is provided", () => {
    delete process.env.ORS_API_KEY
    expect(() => createOrsService()).toThrow(RoutingError)
  })
})

describe("ors.geocode", () => {
  const service = createOrsService("test-key")

  it("returns lat/lon from a successful response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        features: [{ geometry: { coordinates: [144.9631, -37.8136] } }],
      }),
    })

    const result = await service.geocode("Melbourne VIC")
    expect(result).toEqual({ lat: -37.8136, lon: 144.9631 })
  })

  it("throws RoutingError when the response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, statusText: "Unauthorized", text: async () => "Unauthorized" })
    await expect(service.geocode("anywhere")).rejects.toThrow(RoutingError)
  })

  it("throws RoutingError when no features are returned", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ features: [] }),
    })
    await expect(service.geocode("nonexistent place xyz")).rejects.toThrow(RoutingError)
  })
})

describe("ors.getRoute", () => {
  const service = createOrsService("test-key")
  const from = { lat: -37.8136, lon: 144.9631 }
  const to = { lat: -37.8749, lon: 145.0617 }

  it("returns distanceKm and durationMin from a successful response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        routes: [{ summary: { distance: 12400, duration: 1320 } }],
      }),
    })

    const result = await service.getRoute(from, to)
    expect(result.distanceKm).toBe(12.4)
    expect(result.durationMin).toBe(22)
  })

  it("sends coordinates in [lon, lat] order", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        routes: [{ summary: { distance: 5000, duration: 600 } }],
      }),
    })

    await service.getRoute(from, to)

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.coordinates[0]).toEqual([from.lon, from.lat])
    expect(body.coordinates[1]).toEqual([to.lon, to.lat])
  })

  it("throws RoutingError when the response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429, statusText: "Too Many Requests" })
    await expect(service.getRoute(from, to)).rejects.toThrow(RoutingError)
  })

  it("throws RoutingError when no route is found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ routes: [] }),
    })
    await expect(service.getRoute(from, to)).rejects.toThrow(RoutingError)
  })
})
