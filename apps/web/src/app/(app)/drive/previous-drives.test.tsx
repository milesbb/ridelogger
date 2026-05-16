import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { PreviousDrives, buildSlotsFromDetail } from './previous-drives'
import { api } from '@/lib/api/client'
import type { Passenger, Location, DriveDaySummary, DriveDayDetail } from '@/lib/api/types'

vi.mock('@/lib/api/client', () => ({
  api: {
    drive: {
      listSimilarDays: vi.fn(),
      getDay: vi.fn(),
    },
  },
}))

const alice: Passenger = {
  id: 'p1',
  user_id: 'u1',
  name: 'Alice Smith',
  home_location_id: 'loc-alice',
  home_address: '1 Alice St',
  home_lat: null,
  home_lon: null,
  notes: null,
  created_at: '',
  updated_at: '',
}

const homeLocation: Location = {
  id: 'loc-alice',
  user_id: 'u1',
  name: "Alice's Home",
  address: '1 Alice St',
  lat: null,
  lon: null,
  created_at: '',
  updated_at: '',
}

const hospital: Location = {
  id: 'loc-hospital',
  user_id: 'u1',
  name: 'Hospital',
  address: '41 Victoria Parade',
  lat: null,
  lon: null,
  created_at: '',
  updated_at: '',
}

const summary: DriveDaySummary = {
  id: 'dd-1',
  user_id: 'u1',
  date: '2026-05-06',
  start_time: '09:00',
  passenger_names: ['Alice Smith'],
  total_km: 25,
  total_min: 45,
  passenger_km: 12.4,
  passenger_min: 22,
  created_at: '',
  updated_at: '',
}

const detail: DriveDayDetail = {
  ...summary,
  legs: [
    {
      id: 'leg-1',
      drive_day_id: 'dd-1',
      user_id: 'u1',
      from_location_id: 'loc-alice',
      to_location_id: 'loc-hospital',
      passenger_id: 'p1',
      label: 'Alice: pick-up → drop-off',
      distance_km: 12.4,
      duration_min: 22,
      is_passenger_leg: true,
      position: 0,
      from_location_name: "Alice's Home",
      to_location_name: 'Hospital',
      created_at: '',
      updated_at: '',
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('buildSlotsFromDetail', () => {
  it('returns a slot for each passenger leg', () => {
    const slots = buildSlotsFromDetail(detail, [alice], [homeLocation, hospital])
    expect(slots).toHaveLength(1)
    expect(slots[0].passenger.id).toBe('p1')
  })

  it('maps pickup and dropoff location correctly', () => {
    const slots = buildSlotsFromDetail(detail, [alice], [homeLocation, hospital])
    expect(slots[0].pickupLocationId).toBe('loc-alice')
    expect(slots[0].dropoffLocationId).toBe('loc-hospital')
    expect(slots[0].pickupLocationName).toBe("Alice's Home")
    expect(slots[0].dropoffLocationName).toBe('Hospital')
  })

  it('skips legs where passenger or location cannot be found', () => {
    const slots = buildSlotsFromDetail(detail, [], [homeLocation, hospital])
    expect(slots).toHaveLength(0)
  })

  it('skips non-passenger legs', () => {
    const detailWithNonPassengerLeg: DriveDayDetail = {
      ...detail,
      legs: [
        ...detail.legs,
        {
          id: 'leg-2',
          drive_day_id: 'dd-1',
          user_id: 'u1',
          from_location_id: 'loc-hospital',
          to_location_id: 'loc-alice',
          passenger_id: null,
          label: 'Return',
          distance_km: 12.4,
          duration_min: 22,
          is_passenger_leg: false,
          position: 1,
          from_location_name: 'Hospital',
          to_location_name: "Alice's Home",
          created_at: '',
          updated_at: '',
        },
      ],
    }
    const slots = buildSlotsFromDetail(detailWithNonPassengerLeg, [alice], [homeLocation, hospital])
    expect(slots).toHaveLength(1)
  })
})

describe('PreviousDrives — component', () => {
  const onSelect = vi.fn()

  it('has no accessibility violations', async () => {
    vi.mocked(api.drive.listSimilarDays).mockResolvedValue([])
    const { container } = render(
      <PreviousDrives date="2026-05-06" passengers={[alice]} locations={[homeLocation, hospital]} onSelect={onSelect} />
    )
    await waitFor(() => expect(vi.mocked(api.drive.listSimilarDays)).toHaveBeenCalled())
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders nothing when similar days list is empty', async () => {
    vi.mocked(api.drive.listSimilarDays).mockResolvedValue([])
    const { container } = render(
      <PreviousDrives date="2026-05-06" passengers={[alice]} locations={[homeLocation, hospital]} onSelect={onSelect} />
    )
    await waitFor(() => expect(vi.mocked(api.drive.listSimilarDays)).toHaveBeenCalled())
    expect(container.firstChild).toBeNull()
  })

  it('renders similar day entries after API response', async () => {
    vi.mocked(api.drive.listSimilarDays).mockResolvedValue([summary])
    render(
      <PreviousDrives date="2026-05-06" passengers={[alice]} locations={[homeLocation, hospital]} onSelect={onSelect} />
    )
    await waitFor(() => expect(screen.getByText('Alice Smith')).toBeInTheDocument())
    expect(screen.getByText('12.4 km')).toBeInTheDocument()
  })

  it('calls api.drive.listSimilarDays with the provided date', async () => {
    vi.mocked(api.drive.listSimilarDays).mockResolvedValue([])
    render(
      <PreviousDrives date="2026-05-06" passengers={[alice]} locations={[homeLocation, hospital]} onSelect={onSelect} />
    )
    await waitFor(() =>
      expect(vi.mocked(api.drive.listSimilarDays)).toHaveBeenCalledWith('2026-05-06')
    )
  })

  it('calls onSelect with built slots when a day is clicked', async () => {
    vi.mocked(api.drive.listSimilarDays).mockResolvedValue([summary])
    vi.mocked(api.drive.getDay).mockResolvedValue(detail)
    render(
      <PreviousDrives date="2026-05-06" passengers={[alice]} locations={[homeLocation, hospital]} onSelect={onSelect} />
    )
    await waitFor(() => expect(screen.getByText('Alice Smith')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /alice smith/i }))

    await waitFor(() => expect(onSelect).toHaveBeenCalled())
    const slots = onSelect.mock.calls[0][0]
    expect(slots).toHaveLength(1)
    expect(slots[0].passenger.id).toBe('p1')
  })

  it('shows "No passengers" for days with no passenger names', async () => {
    const emptyDay = { ...summary, passenger_names: [] }
    vi.mocked(api.drive.listSimilarDays).mockResolvedValue([emptyDay])
    render(
      <PreviousDrives date="2026-05-06" passengers={[]} locations={[]} onSelect={onSelect} />
    )
    await waitFor(() => expect(screen.getByText('No passengers')).toBeInTheDocument())
  })
})
