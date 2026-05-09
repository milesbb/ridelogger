import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LocationForm } from './location-form'
import { api } from '@/lib/api/client'
import type { Location } from '@/lib/api/types'

vi.mock('@/lib/api/client', () => ({
  api: {
    locations: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

const onDone = vi.fn()

const existing: Location = {
  id: 'loc-1',
  user_id: 'u1',
  name: "St Vincent's Hospital",
  address: '41 Victoria Parade, Fitzroy VIC 3065',
  lat: -37.8064,
  lon: 144.9793,
  created_at: '',
  updated_at: '',
}

function fillAddress(street: string, suburb: string, state: string, postcode: string) {
  fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: street } })
  fireEvent.change(screen.getByLabelText(/suburb/i), { target: { value: suburb } })
  fireEvent.change(screen.getByLabelText(/state/i), { target: { value: state } })
  fireEvent.change(screen.getByLabelText(/postcode/i), { target: { value: postcode } })
}

beforeEach(() => {
  vi.clearAllMocks()
  onDone.mockReset()
})

describe('LocationForm — create mode', () => {
  it('renders name and address fields', () => {
    render(<LocationForm onDone={onDone} />)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/suburb/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/postcode/i)).toBeInTheDocument()
  })

  it('shows Add location submit button', () => {
    render(<LocationForm onDone={onDone} />)
    expect(screen.getByRole('button', { name: /add location/i })).toBeInTheDocument()
  })

  it('calls api.locations.create with assembled address on submit', async () => {
    vi.mocked(api.locations.create).mockResolvedValue(existing)
    render(<LocationForm onDone={onDone} />)

    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: "St Vincent's Hospital" } })
    fillAddress('41 Victoria Parade', 'Fitzroy', 'VIC', '3065')
    fireEvent.submit(screen.getByRole('button', { name: /add location/i }).closest('form')!)

    await waitFor(() =>
      expect(vi.mocked(api.locations.create)).toHaveBeenCalledWith({
        name: "St Vincent's Hospital",
        address: '41 Victoria Parade, Fitzroy VIC 3065',
      })
    )
  })

  it('calls onDone with the created location after successful create', async () => {
    vi.mocked(api.locations.create).mockResolvedValue(existing)
    render(<LocationForm onDone={onDone} />)

    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'Anywhere' } })
    fillAddress('1 Some St', 'Carlton', 'VIC', '3053')
    fireEvent.submit(screen.getByRole('button', { name: /add location/i }).closest('form')!)

    await waitFor(() => expect(onDone).toHaveBeenCalledWith(existing))
  })

  it('shows error message when create fails', async () => {
    vi.mocked(api.locations.create).mockRejectedValue(new Error('Address not found'))
    render(<LocationForm onDone={onDone} />)

    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'X' } })
    fillAddress('1 X St', 'Suburb', 'NSW', '2000')
    fireEvent.submit(screen.getByRole('button', { name: /add location/i }).closest('form')!)

    await waitFor(() => expect(screen.getByText('Address not found')).toBeInTheDocument())
    expect(onDone).not.toHaveBeenCalled()
  })

  it('disables submit button while saving', async () => {
    let resolve: (v: Location) => void
    vi.mocked(api.locations.create).mockReturnValue(new Promise((r) => { resolve = r }))
    render(<LocationForm onDone={onDone} />)

    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'X' } })
    fillAddress('1 X St', 'Suburb', 'NSW', '2000')
    fireEvent.submit(screen.getByRole('button', { name: /add location/i }).closest('form')!)

    await waitFor(() => expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled())
    resolve!(existing)
  })

  it('pre-fills street field from prefillAddress when address is parseable', () => {
    render(<LocationForm prefillAddress="41 Victoria Parade, Fitzroy VIC 3065" onDone={onDone} />)
    expect(screen.getByLabelText(/street address/i)).toHaveValue('41 Victoria Parade')
    expect(screen.getByLabelText(/suburb/i)).toHaveValue('Fitzroy')
    expect(screen.getByLabelText(/postcode/i)).toHaveValue('3065')
  })

  it('pre-fills street field from prefillAddress for unparseable input', () => {
    render(<LocationForm prefillAddress="Some unparseable string" onDone={onDone} />)
    expect(screen.getByLabelText(/street address/i)).toHaveValue('Some unparseable string')
    expect(screen.getByLabelText(/suburb/i)).toHaveValue('')
  })
})

describe('LocationForm — edit mode', () => {
  it('shows Save changes button instead of Add location', () => {
    render(<LocationForm existing={existing} onDone={onDone} />)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add location/i })).not.toBeInTheDocument()
  })

  it('pre-fills name and address fields with existing values', () => {
    render(<LocationForm existing={existing} onDone={onDone} />)
    expect(screen.getByLabelText(/^name/i)).toHaveValue(existing.name)
    expect(screen.getByLabelText(/street address/i)).toHaveValue('41 Victoria Parade')
    expect(screen.getByLabelText(/suburb/i)).toHaveValue('Fitzroy')
    expect(screen.getByLabelText(/postcode/i)).toHaveValue('3065')
  })

  it('calls api.locations.update with assembled address on submit', async () => {
    vi.mocked(api.locations.update).mockResolvedValue(existing)
    render(<LocationForm existing={existing} onDone={onDone} />)

    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'Royal Melbourne' } })
    fireEvent.submit(screen.getByRole('button', { name: /save changes/i }).closest('form')!)

    await waitFor(() =>
      expect(vi.mocked(api.locations.update)).toHaveBeenCalledWith(existing.id, {
        name: 'Royal Melbourne',
        address: existing.address,
      })
    )
  })

  it('calls onDone with the updated location after successful update', async () => {
    vi.mocked(api.locations.update).mockResolvedValue(existing)
    render(<LocationForm existing={existing} onDone={onDone} />)

    fireEvent.submit(screen.getByRole('button', { name: /save changes/i }).closest('form')!)

    await waitFor(() => expect(onDone).toHaveBeenCalledWith(existing))
  })

  it('shows error message when update fails', async () => {
    vi.mocked(api.locations.update).mockRejectedValue(new Error('Network error'))
    render(<LocationForm existing={existing} onDone={onDone} />)

    fireEvent.submit(screen.getByRole('button', { name: /save changes/i }).closest('form')!)

    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument())
    expect(onDone).not.toHaveBeenCalled()
  })
})

describe('LocationForm — cancel', () => {
  it('calls onDone without a value when Cancel is clicked', () => {
    render(<LocationForm onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onDone).toHaveBeenCalledOnce()
  })
})
