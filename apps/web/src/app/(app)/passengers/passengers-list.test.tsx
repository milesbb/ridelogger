import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PassengersList } from './passengers-list'
import { api } from '@/lib/api/client'
import type { Passenger } from '@/lib/api/types'

vi.mock('@/lib/api/client', () => ({
  api: {
    passengers: {
      delete: vi.fn(),
    },
  },
}))

// Stub PassengerForm so dialog content is simple and doesn't leak API calls
vi.mock('./passenger-form', () => ({
  PassengerForm: ({ onDone }: { onDone: () => void }) => (
    <button onClick={onDone}>Stub: done</button>
  ),
}))

const onRefresh = vi.fn()

const alice: Passenger = {
  id: 'p1',
  user_id: 'u1',
  name: 'Alice Smith',
  home_address: '1 Alice St',
  home_location_id: 'loc-1',
  home_lat: null,
  home_lon: null,
  notes: 'Needs wheelchair access',
  created_at: '',
  updated_at: '',
}

const bob: Passenger = {
  id: 'p2',
  user_id: 'u1',
  name: 'Bob Jones',
  home_address: '2 Bob Rd',
  home_location_id: 'loc-2',
  home_lat: null,
  home_lon: null,
  notes: null,
  created_at: '',
  updated_at: '',
}

beforeEach(() => {
  vi.clearAllMocks()
  onRefresh.mockReset()
})

describe('PassengersList — rendering', () => {
  it('shows empty state when there are no passengers', () => {
    render(<PassengersList passengers={[]} onRefresh={onRefresh} />)
    expect(screen.getByText(/no passengers yet/i)).toBeInTheDocument()
  })

  it('renders each passenger name and address', () => {
    render(<PassengersList passengers={[alice, bob]} onRefresh={onRefresh} />)
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('1 Alice St')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    expect(screen.getByText('2 Bob Rd')).toBeInTheDocument()
  })

  it('renders optional notes when present', () => {
    render(<PassengersList passengers={[alice]} onRefresh={onRefresh} />)
    expect(screen.getByText('Needs wheelchair access')).toBeInTheDocument()
  })
})

describe('PassengersList — search', () => {
  it('filters passengers by name', () => {
    render(<PassengersList passengers={[alice, bob]} onRefresh={onRefresh} />)
    fireEvent.change(screen.getByPlaceholderText(/search passengers/i), { target: { value: 'ali' } })
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument()
  })

  it('shows no-match message when search has no results', () => {
    render(<PassengersList passengers={[alice, bob]} onRefresh={onRefresh} />)
    fireEvent.change(screen.getByPlaceholderText(/search passengers/i), { target: { value: 'xyz' } })
    expect(screen.getByText(/no passengers match/i)).toBeInTheDocument()
  })

  it('does not show search input when there are no passengers', () => {
    render(<PassengersList passengers={[]} onRefresh={onRefresh} />)
    expect(screen.queryByPlaceholderText(/search passengers/i)).not.toBeInTheDocument()
  })
})

describe('PassengersList — delete', () => {
  it('calls api.passengers.delete and onRefresh when both confirms are accepted', async () => {
    vi.mocked(api.passengers.delete).mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm')
      .mockReturnValueOnce(true)   // "Remove this passenger?"
      .mockReturnValueOnce(false)  // "Also delete their saved home location?"

    render(<PassengersList passengers={[alice]} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => expect(vi.mocked(api.passengers.delete)).toHaveBeenCalledWith('p1', false))
    expect(onRefresh).toHaveBeenCalled()
  })

  it('passes deleteHomeLocation=true when second confirm is accepted', async () => {
    vi.mocked(api.passengers.delete).mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm')
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)

    render(<PassengersList passengers={[alice]} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => expect(vi.mocked(api.passengers.delete)).toHaveBeenCalledWith('p1', true))
  })

  it('does not delete when first confirm is declined', () => {
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false)

    render(<PassengersList passengers={[alice]} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    expect(vi.mocked(api.passengers.delete)).not.toHaveBeenCalled()
    expect(onRefresh).not.toHaveBeenCalled()
  })
})

// NOTE: The edit and add flows open Radix Dialog components. These tests verify
// that the Dialog opens on trigger click. If happy-dom has issues rendering
// Radix portals, these would be the Playwright trigger point.
describe('PassengersList — edit dialog', () => {
  it('opens edit dialog with form when edit button is clicked', async () => {
    render(<PassengersList passengers={[alice]} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))

    await waitFor(() => expect(screen.getByText('Edit passenger')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /stub: done/i })).toBeInTheDocument()
  })

  it('calls onRefresh when edit form completes', async () => {
    render(<PassengersList passengers={[alice]} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))

    await waitFor(() => expect(screen.getByRole('button', { name: /stub: done/i })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /stub: done/i }))

    expect(onRefresh).toHaveBeenCalled()
  })
})
