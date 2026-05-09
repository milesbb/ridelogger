import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@ridelogger/routing')
vi.mock('../utils/routingKey')
vi.mock('../utils/logging', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { createRoutingService } from '@ridelogger/routing'
import { getRoutingApiKey, getRoutingProvider } from '../utils/routingKey'
import { geocodeAddress } from './geocode'

const mockGeocode = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getRoutingProvider).mockReturnValue('ors')
  vi.mocked(getRoutingApiKey).mockResolvedValue('test-key')
  vi.mocked(createRoutingService).mockResolvedValue({ geocode: mockGeocode, getRoute: vi.fn() })
})

describe('geocodeAddress', () => {
  it('returns coords from the routing service', async () => {
    mockGeocode.mockResolvedValue({ lat: -37.8, lon: 144.9 })

    const result = await geocodeAddress('123 Main St, Melbourne VIC')

    expect(result).toEqual({ lat: -37.8, lon: 144.9 })
  })

  it('throws BadRequest with user-facing message when the routing service fails', async () => {
    mockGeocode.mockRejectedValue(new Error('No results'))

    await expect(geocodeAddress('not a real address')).rejects.toMatchObject({
      errorKey: 'BadRequest',
      message: 'Could not locate that address — please check it and try again.',
    })
  })
})
