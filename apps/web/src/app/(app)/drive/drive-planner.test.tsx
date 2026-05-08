import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DrivePlanner } from './drive-planner'
import { api } from '@/lib/api/client'
import type { Passenger, Location, AppSettings, DriveLegResult } from '@/lib/api/types'

vi.mock('@/lib/api/client', () => ({
  api: {
    drive: {
      calculate: vi.fn(),
      save: vi.fn(),
      getPassengerDropoffs: vi.fn(),
    },
    passengers: {
      list: vi.fn(),
    },
  },
}))

vi.mock('./previous-drives', () => ({
  PreviousDrives: () => null,
  buildSlotsFromDetail: () => [],
}))

vi.mock('./destination-picker', () => ({
  DestinationPicker: (props: { onSelect: (id: string, name: string) => void; onClose: () => void }) => (
    <div data-testid="destination-picker">
      <button onClick={() => { props.onSelect('loc-drop-1', 'Drop-off Spot'); props.onClose() }}>
        Select location
      </button>
    </div>
  ),
}))

vi.mock('./drive-results-table', () => ({
  DriveResultsTable: () => <div data-testid="results-table" />,
}))

const alice: Passenger = {
  id: 'p-alice',
  user_id: 'u1',
  name: 'Alice Smith',
  home_address: '1 Alice St',
  home_location_id: 'loc-alice-home',
  home_lat: null,
  home_lon: null,
  notes: null,
  created_at: '',
  updated_at: '',
}

const bob: Passenger = {
  id: 'p-bob',
  user_id: 'u1',
  name: 'Bob Jones',
  home_address: '2 Bob Rd',
  home_location_id: 'loc-bob-home',
  home_lat: null,
  home_lon: null,
  notes: null,
  created_at: '',
  updated_at: '',
}

const locations: Location[] = [
  { id: 'loc-home', user_id: 'u1', name: 'Home', address: '1 Main St', lat: null, lon: null, created_at: '', updated_at: '' },
  { id: 'loc-alice-home', user_id: 'u1', name: "Alice's Home", address: '1 Alice St', lat: null, lon: null, created_at: '', updated_at: '' },
  { id: 'loc-bob-home', user_id: 'u1', name: "Bob's Home", address: '2 Bob Rd', lat: null, lon: null, created_at: '', updated_at: '' },
]

const settings: AppSettings = {
  id: 's1',
  user_id: 'u1',
  home_location_id: 'loc-home',
  home_address: '1 Main St',
  home_lat: null,
  home_lon: null,
  created_at: '',
  updated_at: '',
}

const fakeResults: DriveLegResult[] = [
  { label: 'Home → pickup', distanceKm: 5, durationMin: 10, passengerLeg: false },
  { label: 'pickup → dropoff', distanceKm: 8, durationMin: 15, passengerLeg: true },
  { label: 'dropoff → pickup', distanceKm: 8, durationMin: 15, passengerLeg: false },
  { label: 'pickup → Home', distanceKm: 5, durationMin: 10, passengerLeg: false },
]

const defaultProps = {
  passengers: [alice, bob],
  locations,
  settings,
  onLocationsChange: vi.fn(),
  onPassengersChange: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.drive.getPassengerDropoffs).mockResolvedValue([])
})

describe('DrivePlanner — passenger selection', () => {
  it('renders unselected passengers as buttons', () => {
    render(<DrivePlanner {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Alice Smith' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bob Jones' })).toBeInTheDocument()
  })

  it('filters passengers by search input', () => {
    render(<DrivePlanner {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText(/search passengers/i), { target: { value: 'ali' } })
    expect(screen.getByRole('button', { name: 'Alice Smith' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Bob Jones' })).not.toBeInTheDocument()
  })

  it('shows no-match message when search has no results', () => {
    render(<DrivePlanner {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText(/search passengers/i), { target: { value: 'xyz' } })
    expect(screen.getByText(/no passengers match/i)).toBeInTheDocument()
  })

  it('adds passenger to trip order when their button is clicked', () => {
    render(<DrivePlanner {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Alice Smith' }))
    expect(screen.getByText(/trip order/i)).toBeInTheDocument()
    expect(screen.getAllByText('Alice Smith').length).toBeGreaterThan(0)
  })

  it('removes passenger from trip order when Remove is clicked', () => {
    render(<DrivePlanner {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Alice Smith' }))
    fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(screen.queryByText(/trip order/i)).not.toBeInTheDocument()
  })

  it('shows "All passengers added" when all passengers are in slots', () => {
    render(<DrivePlanner {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Alice Smith' }))
    fireEvent.click(screen.getByRole('button', { name: 'Bob Jones' }))
    expect(screen.getByText(/all passengers added/i)).toBeInTheDocument()
  })

  it('clears search when a passenger is added', () => {
    render(<DrivePlanner {...defaultProps} />)
    const search = screen.getByPlaceholderText(/search passengers/i)
    fireEvent.change(search, { target: { value: 'ali' } })
    fireEvent.click(screen.getByRole('button', { name: 'Alice Smith' }))
    expect(search).toHaveValue('')
  })
})

describe('DrivePlanner — slot reordering', () => {
  it('moves a slot down when the down arrow is clicked', () => {
    render(<DrivePlanner {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Alice Smith' }))
    fireEvent.click(screen.getByRole('button', { name: 'Bob Jones' }))

    // First slot (Alice) has "Move down" enabled; second slot (Bob) has it disabled
    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i })
    expect(moveDownButtons[0]).not.toBeDisabled()
    fireEvent.click(moveDownButtons[0])

    // Slot names appear as <p> inside each slot card — Bob should now be first
    const slotNameEls = screen.getAllByText(/Alice Smith|Bob Jones/).filter((el) => el.tagName === 'P')
    expect(slotNameEls[0]).toHaveTextContent('Bob Jones')
    expect(slotNameEls[1]).toHaveTextContent('Alice Smith')
  })
})

describe('DrivePlanner — calculate flow', () => {
  async function setupSlotWithDropoff() {
    render(<DrivePlanner {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Alice Smith' }))
    fireEvent.click(screen.getByRole('button', { name: /^set$/i }))
    await waitFor(() => expect(screen.getByTestId('destination-picker')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /select location/i }))
    await waitFor(() => expect(screen.queryByTestId('destination-picker')).not.toBeInTheDocument())
  }

  it('shows Finish day button after dropoff is set', async () => {
    await setupSlotWithDropoff()
    expect(screen.getByRole('button', { name: /finish day/i })).toBeInTheDocument()
  })

  it('calls api.drive.calculate with correct legs when Finish day is clicked', async () => {
    vi.mocked(api.drive.calculate).mockResolvedValue(fakeResults)
    await setupSlotWithDropoff()

    fireEvent.click(screen.getByRole('button', { name: /finish day/i }))

    await waitFor(() => expect(vi.mocked(api.drive.calculate)).toHaveBeenCalledOnce())
    const [legs] = vi.mocked(api.drive.calculate).mock.calls[0]
    expect(legs).toHaveLength(4)
    expect(legs[0]).toMatchObject({ fromLocationId: 'loc-home', toLocationId: 'loc-alice-home', passengerLeg: false })
    expect(legs[1]).toMatchObject({ fromLocationId: 'loc-alice-home', toLocationId: 'loc-drop-1', passengerLeg: true })
    expect(legs[2]).toMatchObject({ fromLocationId: 'loc-drop-1', toLocationId: 'loc-alice-home', passengerLeg: false })
    expect(legs[3]).toMatchObject({ fromLocationId: 'loc-alice-home', toLocationId: 'loc-home', passengerLeg: false })
  })

  it('shows results table after successful calculate', async () => {
    vi.mocked(api.drive.calculate).mockResolvedValue(fakeResults)
    await setupSlotWithDropoff()

    fireEvent.click(screen.getByRole('button', { name: /finish day/i }))

    await waitFor(() => expect(screen.getByTestId('results-table')).toBeInTheDocument())
  })

  it('shows error message when calculate fails', async () => {
    vi.mocked(api.drive.calculate).mockRejectedValue(new Error('Routing unavailable'))
    await setupSlotWithDropoff()

    fireEvent.click(screen.getByRole('button', { name: /finish day/i }))

    await waitFor(() => expect(screen.getByText('Routing unavailable')).toBeInTheDocument())
  })

  it('disables Finish day button while calculating', async () => {
    let resolve: (v: DriveLegResult[]) => void
    vi.mocked(api.drive.calculate).mockReturnValue(new Promise((r) => { resolve = r }))
    await setupSlotWithDropoff()

    fireEvent.click(screen.getByRole('button', { name: /finish day/i }))

    await waitFor(() => expect(screen.getByRole('button', { name: /calculating/i })).toBeDisabled())
    resolve!(fakeResults)
  })
})
