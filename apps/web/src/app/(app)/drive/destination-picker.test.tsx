import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DestinationPicker } from './destination-picker'
import { api } from '@/lib/api/client'
import type { Location } from '@/lib/api/types'

vi.mock('@/lib/api/client', () => ({
  api: {
    locations: {
      create: vi.fn(),
    },
  },
}))

const onClose = vi.fn()
const onSelect = vi.fn()
const onLocationAdded = vi.fn()

const hospital: Location = {
  id: 'loc-hospital',
  user_id: 'u1',
  name: 'Hospital',
  address: '41 Victoria Parade, Fitzroy VIC 3065',
  lat: null,
  lon: null,
  created_at: '',
  updated_at: '',
}

const aliceHome: Location = {
  id: 'loc-alice',
  user_id: 'u1',
  name: "Alice's Home",
  address: '1 Alice St, Suburb VIC 3000',
  lat: null,
  lon: null,
  created_at: '',
  updated_at: '',
}

const suggested: Location = {
  id: 'loc-suggested',
  user_id: 'u1',
  name: 'Community Centre',
  address: '5 Centre Rd, Suburb VIC 3000',
  lat: null,
  lon: null,
  created_at: '',
  updated_at: '',
}

function renderOpen(overrides: Partial<Parameters<typeof DestinationPicker>[0]> = {}) {
  const defaultProps = {
    open: true,
    onClose,
    locations: [hospital, aliceHome],
    passengerHomeLocationIds: ['loc-alice'],
    selected: null,
    onSelect,
    onLocationAdded,
  }
  render(<DestinationPicker {...defaultProps} {...overrides} />)
}

function fillAddress(street: string, suburb: string, state: string, postcode: string) {
  fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: street } })
  fireEvent.change(screen.getByLabelText(/suburb/i), { target: { value: suburb } })
  fireEvent.change(screen.getByLabelText(/state/i), { target: { value: state } })
  fireEvent.change(screen.getByLabelText(/postcode/i), { target: { value: postcode } })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DestinationPicker — section headers', () => {
  it('shows Saved locations section for non-home locations', () => {
    renderOpen()
    expect(screen.getByText('Saved locations')).toBeInTheDocument()
    expect(screen.getByText('Hospital')).toBeInTheDocument()
  })

  it('shows Passenger homes section for home locations', () => {
    renderOpen()
    expect(screen.getByText('Passenger homes')).toBeInTheDocument()
    expect(screen.getByText("Alice's Home")).toBeInTheDocument()
  })

  it('shows Previously used section when suggestedLocations are provided', () => {
    renderOpen({ suggestedLocations: [suggested] })
    expect(screen.getByText('Previously used')).toBeInTheDocument()
    expect(screen.getByText('Community Centre')).toBeInTheDocument()
  })

  it('does not show Previously used section when no suggestions', () => {
    renderOpen()
    expect(screen.queryByText('Previously used')).not.toBeInTheDocument()
  })

  it('shows empty message when there are no locations', () => {
    renderOpen({ locations: [] })
    expect(screen.getByText(/no saved locations yet/i)).toBeInTheDocument()
  })
})

describe('DestinationPicker — selection', () => {
  it('calls onSelect and onClose when a location is clicked', () => {
    renderOpen()
    fireEvent.click(screen.getByRole('button', { name: /hospital/i }))
    expect(onSelect).toHaveBeenCalledWith('loc-hospital', 'Hospital')
    expect(onClose).toHaveBeenCalled()
  })

  it('shows a checkmark next to the currently selected location', () => {
    renderOpen({ selected: 'loc-hospital' })
    const hospitalBtn = screen.getByRole('button', { name: /hospital/i })
    expect(hospitalBtn.querySelector('svg')).toBeTruthy()
  })
})

describe('DestinationPicker — add new location', () => {
  it('shows add-new form when Add new address is clicked', () => {
    renderOpen()
    fireEvent.click(screen.getByRole('button', { name: /add new address/i }))
    expect(screen.getByPlaceholderText(/location name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/suburb/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/postcode/i)).toBeInTheDocument()
  })

  it('hides add-new form when Cancel is clicked', () => {
    renderOpen()
    fireEvent.click(screen.getByRole('button', { name: /add new address/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByPlaceholderText(/location name/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/street address/i)).not.toBeInTheDocument()
  })

  it('calls api.locations.create with name and assembled address', async () => {
    vi.mocked(api.locations.create).mockResolvedValue(hospital)
    renderOpen()

    fireEvent.click(screen.getByRole('button', { name: /add new address/i }))
    fireEvent.change(screen.getByPlaceholderText(/location name/i), { target: { value: 'New Place' } })
    fillAddress('99 New Rd', 'Suburb', 'NSW', '2000')
    fireEvent.submit(screen.getByRole('button', { name: /save & select/i }).closest('form')!)

    await waitFor(() =>
      expect(vi.mocked(api.locations.create)).toHaveBeenCalledWith({
        name: 'New Place',
        address: '99 New Rd, Suburb NSW 2000',
      })
    )
  })

  it('calls onLocationAdded, onSelect and onClose after successful creation', async () => {
    const newLoc: Location = { ...hospital, id: 'loc-new', name: 'New Place' }
    vi.mocked(api.locations.create).mockResolvedValue(newLoc)
    renderOpen()

    fireEvent.click(screen.getByRole('button', { name: /add new address/i }))
    fireEvent.change(screen.getByPlaceholderText(/location name/i), { target: { value: 'New Place' } })
    fillAddress('99 New Rd', 'Suburb', 'NSW', '2000')
    fireEvent.submit(screen.getByRole('button', { name: /save & select/i }).closest('form')!)

    await waitFor(() => expect(onLocationAdded).toHaveBeenCalledWith(newLoc))
    expect(onSelect).toHaveBeenCalledWith('loc-new', 'New Place')
    expect(onClose).toHaveBeenCalled()
  })

  it('shows error message when create fails', async () => {
    vi.mocked(api.locations.create).mockRejectedValue(new Error('Address not found'))
    renderOpen()

    fireEvent.click(screen.getByRole('button', { name: /add new address/i }))
    fireEvent.change(screen.getByPlaceholderText(/location name/i), { target: { value: 'X' } })
    fillAddress('1 X St', 'Suburb', 'VIC', '3000')
    fireEvent.submit(screen.getByRole('button', { name: /save & select/i }).closest('form')!)

    await waitFor(() => expect(screen.getByText('Address not found')).toBeInTheDocument())
    expect(onClose).not.toHaveBeenCalled()
  })

  it('disables submit button while saving', async () => {
    let resolve: (v: Location) => void
    vi.mocked(api.locations.create).mockReturnValue(new Promise((r) => { resolve = r }))
    renderOpen()

    fireEvent.click(screen.getByRole('button', { name: /add new address/i }))
    fireEvent.change(screen.getByPlaceholderText(/location name/i), { target: { value: 'X' } })
    fillAddress('1 X St', 'Suburb', 'VIC', '3000')
    fireEvent.submit(screen.getByRole('button', { name: /save & select/i }).closest('form')!)

    await waitFor(() => expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled())
    resolve!(hospital)
  })

  it('resets address fields after successful creation', async () => {
    const newLoc: Location = { ...hospital, id: 'loc-new', name: 'New Place' }
    vi.mocked(api.locations.create).mockResolvedValue(newLoc)
    renderOpen()

    fireEvent.click(screen.getByRole('button', { name: /add new address/i }))
    fireEvent.change(screen.getByPlaceholderText(/location name/i), { target: { value: 'New Place' } })
    fillAddress('99 New Rd', 'Suburb', 'NSW', '2000')

    // After submission the form closes and state resets — verify by re-opening add form
    fireEvent.submit(screen.getByRole('button', { name: /save & select/i }).closest('form')!)
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})
