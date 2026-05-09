import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PassengerForm } from './passenger-form'
import { api } from '@/lib/api/client'
import type { Passenger, Location } from '@/lib/api/types'

vi.mock('@/lib/api/client', () => ({
  api: {
    passengers: {
      create: vi.fn(),
      update: vi.fn(),
    },
    locations: {
      list: vi.fn(),
    },
  },
}))

const onDone = vi.fn()

const existing: Passenger = {
  id: 'p1',
  user_id: 'u1',
  name: 'Alice Smith',
  home_address: '10 Alice St, Suburb VIC 3000',
  home_location_id: 'loc-1',
  home_lat: null,
  home_lon: null,
  notes: null,
  created_at: '',
  updated_at: '',
}

const savedLocations: Location[] = [
  {
    id: 'loc-saved-1',
    user_id: 'u1',
    name: 'Community Centre',
    address: '5 Centre Rd, Suburb VIC 3000',
    lat: null,
    lon: null,
    created_at: '',
    updated_at: '',
  },
]

function fillNewAddress(street: string, suburb: string, state: string, postcode: string) {
  fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: street } })
  fireEvent.change(screen.getByLabelText(/suburb/i), { target: { value: suburb } })
  fireEvent.change(screen.getByLabelText(/state/i), { target: { value: state } })
  fireEvent.change(screen.getByLabelText(/postcode/i), { target: { value: postcode } })
}

beforeEach(() => {
  vi.clearAllMocks()
  onDone.mockReset()
})

describe('PassengerForm — create mode', () => {
  it('renders name, home address, and notes fields', () => {
    render(<PassengerForm onDone={onDone} />)
    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/suburb/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/postcode/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
  })

  it('calls api.passengers.create with assembled address on submit', async () => {
    vi.mocked(api.passengers.create).mockResolvedValue(existing)
    render(<PassengerForm onDone={onDone} />)

    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'Bob Jones' } })
    fillNewAddress('99 Bob Rd', 'Suburb', 'VIC', '3000')
    fireEvent.change(screen.getByLabelText(/notes/i), { target: { value: 'Needs extra time' } })
    fireEvent.submit(screen.getByRole('button', { name: /add passenger/i }).closest('form')!)

    await waitFor(() =>
      expect(vi.mocked(api.passengers.create)).toHaveBeenCalledWith({
        name: 'Bob Jones',
        homeAddress: '99 Bob Rd, Suburb VIC 3000',
        notes: 'Needs extra time',
      })
    )
  })

  it('calls onDone after successful create', async () => {
    vi.mocked(api.passengers.create).mockResolvedValue(existing)
    render(<PassengerForm onDone={onDone} />)

    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'Bob' } })
    fillNewAddress('1 Bob St', 'Suburb', 'VIC', '3000')
    fireEvent.submit(screen.getByRole('button', { name: /add passenger/i }).closest('form')!)

    await waitFor(() => expect(onDone).toHaveBeenCalled())
  })

  it('shows error message when create fails', async () => {
    vi.mocked(api.passengers.create).mockRejectedValue(new Error('Address not found'))
    render(<PassengerForm onDone={onDone} />)

    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'Bob' } })
    fillNewAddress('1 Bob St', 'Suburb', 'VIC', '3000')
    fireEvent.submit(screen.getByRole('button', { name: /add passenger/i }).closest('form')!)

    await waitFor(() => expect(screen.getByText('Address not found')).toBeInTheDocument())
    expect(onDone).not.toHaveBeenCalled()
  })

  it('disables submit button while saving', async () => {
    let resolve: (v: Passenger) => void
    vi.mocked(api.passengers.create).mockReturnValue(new Promise((r) => { resolve = r }))
    render(<PassengerForm onDone={onDone} />)

    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'Bob' } })
    fillNewAddress('1 Bob St', 'Suburb', 'VIC', '3000')
    fireEvent.submit(screen.getByRole('button', { name: /add passenger/i }).closest('form')!)

    await waitFor(() => expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled())
    resolve!(existing)
  })
})

describe('PassengerForm — edit mode', () => {
  it('shows existing home address and edit/switch buttons', () => {
    render(<PassengerForm existing={existing} onDone={onDone} />)
    expect(screen.getByText(existing.home_address)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit address/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /use a saved location/i })).toBeInTheDocument()
  })

  it('clicking Edit address shows structured address fields and cancel', () => {
    render(<PassengerForm existing={existing} onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: /edit address/i }))
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/suburb/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/postcode/i)).toBeInTheDocument()
    // Section-level cancel + form-level cancel
    expect(screen.getAllByRole('button', { name: /cancel/i })).toHaveLength(2)
  })

  it('pre-fills structured fields from existing home_address in edit mode', () => {
    render(<PassengerForm existing={existing} onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: /edit address/i }))
    expect(screen.getByLabelText(/street address/i)).toHaveValue('10 Alice St')
    expect(screen.getByLabelText(/suburb/i)).toHaveValue('Suburb')
    expect(screen.getByLabelText(/postcode/i)).toHaveValue('3000')
  })

  it('cancel in edit mode returns to address display', () => {
    render(<PassengerForm existing={existing} onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: /edit address/i }))
    // Section Cancel is first; form-level Cancel (calls onDone) is second
    fireEvent.click(screen.getAllByRole('button', { name: /cancel/i })[0])
    expect(screen.getByText(existing.home_address)).toBeInTheDocument()
  })

  it('submits with homeUpdate type "none" when address is not changed', async () => {
    vi.mocked(api.passengers.update).mockResolvedValue(existing)
    render(<PassengerForm existing={existing} onDone={onDone} />)

    fireEvent.submit(screen.getByRole('button', { name: /save changes/i }).closest('form')!)

    await waitFor(() =>
      expect(vi.mocked(api.passengers.update)).toHaveBeenCalledWith(
        existing.id,
        expect.objectContaining({ homeUpdate: { type: 'none' } }),
      )
    )
  })

  it('submits with homeUpdate type "edit" with assembled address when fields are changed', async () => {
    vi.mocked(api.passengers.update).mockResolvedValue(existing)
    render(<PassengerForm existing={existing} onDone={onDone} />)

    fireEvent.click(screen.getByRole('button', { name: /edit address/i }))
    fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: '42 New Rd' } })
    fireEvent.submit(screen.getByRole('button', { name: /save changes/i }).closest('form')!)

    await waitFor(() =>
      expect(vi.mocked(api.passengers.update)).toHaveBeenCalledWith(
        existing.id,
        expect.objectContaining({
          homeUpdate: { type: 'edit', address: '42 New Rd, Suburb VIC 3000' },
        }),
      )
    )
  })

  it('loads locations from API when switching to saved location mode', async () => {
    vi.mocked(api.locations.list).mockResolvedValue(savedLocations)
    render(<PassengerForm existing={existing} onDone={onDone} />)

    fireEvent.click(screen.getByRole('button', { name: /use a saved location/i }))

    await waitFor(() => expect(screen.getByText('Community Centre')).toBeInTheDocument())
    expect(vi.mocked(api.locations.list)).toHaveBeenCalledOnce()
  })

  it('does not reload locations if already loaded', async () => {
    vi.mocked(api.locations.list).mockResolvedValue(savedLocations)
    render(<PassengerForm existing={existing} onDone={onDone} />)

    fireEvent.click(screen.getByRole('button', { name: /use a saved location/i }))
    await waitFor(() => expect(screen.getByText('Community Centre')).toBeInTheDocument())

    // Section Cancel is first; form-level Cancel is second
    fireEvent.click(screen.getAllByRole('button', { name: /cancel/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /use a saved location/i }))
    await waitFor(() => expect(screen.getByText('Community Centre')).toBeInTheDocument())

    expect(vi.mocked(api.locations.list)).toHaveBeenCalledOnce()
  })

  it('submit is disabled in switch mode until a location is selected', async () => {
    vi.mocked(api.locations.list).mockResolvedValue(savedLocations)
    render(<PassengerForm existing={existing} onDone={onDone} />)

    fireEvent.click(screen.getByRole('button', { name: /use a saved location/i }))
    await waitFor(() => expect(screen.getByText('Community Centre')).toBeInTheDocument())

    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled()
  })

  it('submits with homeUpdate type "switch" when a saved location is selected', async () => {
    vi.mocked(api.locations.list).mockResolvedValue(savedLocations)
    vi.mocked(api.passengers.update).mockResolvedValue(existing)
    render(<PassengerForm existing={existing} onDone={onDone} />)

    fireEvent.click(screen.getByRole('button', { name: /use a saved location/i }))
    await waitFor(() => expect(screen.getByText('Community Centre')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /community centre/i }))
    fireEvent.submit(screen.getByRole('button', { name: /save changes/i }).closest('form')!)

    await waitFor(() =>
      expect(vi.mocked(api.passengers.update)).toHaveBeenCalledWith(
        existing.id,
        expect.objectContaining({
          homeUpdate: { type: 'switch', locationId: 'loc-saved-1' },
        }),
      )
    )
  })

  it('cancel in switch mode returns to address display', async () => {
    vi.mocked(api.locations.list).mockResolvedValue(savedLocations)
    render(<PassengerForm existing={existing} onDone={onDone} />)

    fireEvent.click(screen.getByRole('button', { name: /use a saved location/i }))
    await waitFor(() => expect(screen.getByText('Community Centre')).toBeInTheDocument())

    // Section Cancel is first; form-level Cancel is second
    fireEvent.click(screen.getAllByRole('button', { name: /cancel/i })[0])
    expect(screen.getByText(existing.home_address)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled()
  })

  it('calls onDone after successful update', async () => {
    vi.mocked(api.passengers.update).mockResolvedValue(existing)
    render(<PassengerForm existing={existing} onDone={onDone} />)

    fireEvent.submit(screen.getByRole('button', { name: /save changes/i }).closest('form')!)

    await waitFor(() => expect(onDone).toHaveBeenCalled())
  })

  it('shows error message when update fails', async () => {
    vi.mocked(api.passengers.update).mockRejectedValue(new Error('Network error'))
    render(<PassengerForm existing={existing} onDone={onDone} />)

    fireEvent.submit(screen.getByRole('button', { name: /save changes/i }).closest('form')!)

    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument())
    expect(onDone).not.toHaveBeenCalled()
  })
})
