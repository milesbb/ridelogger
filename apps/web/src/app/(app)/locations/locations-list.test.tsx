import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { LocationsList } from './locations-list'
import { api } from '@/lib/api/client'
import type { Location } from '@/lib/api/types'

vi.mock('@/lib/api/client', () => ({
  api: {
    locations: {
      delete: vi.fn(),
    },
  },
}))

vi.mock('./location-form', () => ({
  LocationForm: ({ onDone }: { onDone: () => void }) => (
    <button onClick={onDone}>Stub: done</button>
  ),
}))

const onRefresh = vi.fn()

const hospitalLocation: Location = {
  id: 'loc-1',
  user_id: 'u1',
  name: "St Vincent's Hospital",
  address: '41 Victoria Parade, Fitzroy VIC 3065',
  lat: -37.8064,
  lon: 144.9793,
  created_at: '',
  updated_at: '',
}

const centreLocation: Location = {
  id: 'loc-2',
  user_id: 'u1',
  name: 'Community Centre',
  address: '5 Centre Rd, Suburb VIC 3000',
  lat: null,
  lon: null,
  created_at: '',
  updated_at: '',
}

beforeEach(() => {
  vi.clearAllMocks()
  onRefresh.mockReset()
})

describe('LocationsList — rendering', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<LocationsList locations={[hospitalLocation]} onRefresh={onRefresh} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('shows empty state when there are no locations', () => {
    render(<LocationsList locations={[]} onRefresh={onRefresh} />)
    expect(screen.getByText(/no locations yet/i)).toBeInTheDocument()
  })

  it('renders each location name and address', () => {
    render(<LocationsList locations={[hospitalLocation, centreLocation]} onRefresh={onRefresh} />)
    expect(screen.getByText("St Vincent's Hospital")).toBeInTheDocument()
    expect(screen.getByText('41 Victoria Parade, Fitzroy VIC 3065')).toBeInTheDocument()
    expect(screen.getByText('Community Centre')).toBeInTheDocument()
    expect(screen.getByText('5 Centre Rd, Suburb VIC 3000')).toBeInTheDocument()
  })

  it('renders Locations heading', () => {
    render(<LocationsList locations={[hospitalLocation]} onRefresh={onRefresh} />)
    expect(screen.getByRole('heading', { name: /locations/i })).toBeInTheDocument()
  })
})

describe('LocationsList — delete', () => {
  it('calls api.locations.delete and onRefresh when remove is confirmed', async () => {
    vi.mocked(api.locations.delete).mockResolvedValue(undefined)

    render(<LocationsList locations={[hospitalLocation]} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => expect(screen.getByText('Remove location?')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /^remove$/i }))

    await waitFor(() => expect(vi.mocked(api.locations.delete)).toHaveBeenCalledWith('loc-1'))
    expect(onRefresh).toHaveBeenCalled()
  })

  it('does not delete when dialog is cancelled', async () => {
    render(<LocationsList locations={[hospitalLocation]} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => expect(screen.getByText('Remove location?')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(vi.mocked(api.locations.delete)).not.toHaveBeenCalled()
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('shows inline error message when delete fails', async () => {
    vi.mocked(api.locations.delete).mockRejectedValue(new Error('Location is in use'))

    render(<LocationsList locations={[hospitalLocation]} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => expect(screen.getByText('Remove location?')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /^remove$/i }))

    await waitFor(() => expect(screen.getByText('Location is in use')).toBeInTheDocument())
    expect(onRefresh).not.toHaveBeenCalled()
  })
})

describe('LocationsList — edit dialog', () => {
  it('opens edit dialog when edit button is clicked', async () => {
    render(<LocationsList locations={[hospitalLocation]} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))

    await waitFor(() => expect(screen.getByText('Edit location')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /stub: done/i })).toBeInTheDocument()
  })

  it('calls onRefresh when edit form completes', async () => {
    render(<LocationsList locations={[hospitalLocation]} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))

    await waitFor(() => expect(screen.getByRole('button', { name: /stub: done/i })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /stub: done/i }))

    expect(onRefresh).toHaveBeenCalled()
  })
})

describe('LocationsList — add dialog', () => {
  it('opens add dialog when Add button is clicked', async () => {
    render(<LocationsList locations={[]} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByRole('button', { name: /add/i }))

    await waitFor(() => expect(screen.getByText('Add location')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /stub: done/i })).toBeInTheDocument()
  })

  it('calls onRefresh when add form completes', async () => {
    render(<LocationsList locations={[]} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByRole('button', { name: /add/i }))

    await waitFor(() => expect(screen.getByRole('button', { name: /stub: done/i })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /stub: done/i }))

    expect(onRefresh).toHaveBeenCalled()
  })
})
