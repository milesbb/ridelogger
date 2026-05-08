import { describe, it, expect, vi, beforeEach } from "vitest"
import { createOrsService } from "../ors"
import { createGoogleService } from "../google"
import type { RoutingService } from "../types"
import { RoutingError } from "../types"

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

beforeEach(() => {
  mockFetch.mockReset()
})

interface ProviderMocks {
  geocodeSuccess: unknown
  geocodeNonOk: unknown
  geocodeNoResult: unknown
  routeSuccess: unknown
  routeNonOk: unknown
  routeNoResult: unknown
}

function runProviderContract(
  name: string,
  makeService: () => RoutingService,
  mocks: ProviderMocks,
): void {
  describe(`${name} satisfies RoutingService`, () => {
    const service = makeService()
    const from = { lat: -37.8136, lon: 144.9631 }
    const to = { lat: -37.8749, lon: 145.0617 }

    describe("geocode", () => {
      it("returns { lat, lon } from a successful response", async () => {
        mockFetch.mockResolvedValueOnce(mocks.geocodeSuccess)
        const result = await service.geocode("Melbourne VIC")
        expect(result).toEqual({ lat: -37.8136, lon: 144.9631 })
      })

      it("throws RoutingError on non-ok response", async () => {
        mockFetch.mockResolvedValueOnce(mocks.geocodeNonOk)
        await expect(service.geocode("anywhere")).rejects.toThrow(RoutingError)
      })

      it("throws RoutingError when no result returned", async () => {
        mockFetch.mockResolvedValueOnce(mocks.geocodeNoResult)
        await expect(service.geocode("nonexistent place xyz")).rejects.toThrow(RoutingError)
      })
    })

    describe("getRoute", () => {
      it("returns { distanceKm, durationMin } from a successful response", async () => {
        mockFetch.mockResolvedValueOnce(mocks.routeSuccess)
        const result = await service.getRoute(from, to)
        expect(result).toEqual({ distanceKm: 12.4, durationMin: 22 })
      })

      it("throws RoutingError on non-ok response", async () => {
        mockFetch.mockResolvedValueOnce(mocks.routeNonOk)
        await expect(service.getRoute(from, to)).rejects.toThrow(RoutingError)
      })

      it("throws RoutingError when no route found", async () => {
        mockFetch.mockResolvedValueOnce(mocks.routeNoResult)
        await expect(service.getRoute(from, to)).rejects.toThrow(RoutingError)
      })
    })
  })
}

runProviderContract(
  "ORS",
  () => createOrsService("test-key"),
  {
    geocodeSuccess: {
      ok: true,
      json: async () => ({ features: [{ geometry: { coordinates: [144.9631, -37.8136] } }] }),
    },
    geocodeNonOk: { ok: false, status: 401, statusText: "Unauthorized", text: async () => "Unauthorized" },
    geocodeNoResult: { ok: true, json: async () => ({ features: [] }) },
    routeSuccess: {
      ok: true,
      json: async () => ({ routes: [{ summary: { distance: 12400, duration: 1320 } }] }),
    },
    routeNonOk: { ok: false, status: 429, statusText: "Too Many Requests" },
    routeNoResult: { ok: true, json: async () => ({ routes: [] }) },
  },
)

runProviderContract(
  "Google",
  () => createGoogleService("test-key"),
  {
    geocodeSuccess: {
      ok: true,
      json: async () => ({
        status: "OK",
        results: [{ geometry: { location: { lat: -37.8136, lng: 144.9631 } } }],
      }),
    },
    geocodeNonOk: { ok: false, status: 401, statusText: "Unauthorized" },
    geocodeNoResult: { ok: true, json: async () => ({ status: "ZERO_RESULTS", results: [] }) },
    routeSuccess: {
      ok: true,
      json: async () => ({
        status: "OK",
        routes: [{ legs: [{ distance: { value: 12400 }, duration: { value: 1320 } }] }],
      }),
    },
    routeNonOk: { ok: false, status: 429, statusText: "Too Many Requests" },
    routeNoResult: { ok: true, json: async () => ({ status: "ZERO_RESULTS", routes: [] }) },
  },
)
