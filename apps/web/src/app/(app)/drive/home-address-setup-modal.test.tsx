import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { configureAxe } from 'vitest-axe'
import { HomeAddressSetupModal } from './home-address-setup-modal'
import { api } from '@/lib/api/client'
import type { AppSettings } from '@/lib/api/types'

vi.mock('@/lib/api/client', () => ({
  api: {
    settings: {
      save: vi.fn(),
    },
  },
}))

const mockSettings: AppSettings = {
  id: 's1',
  user_id: 'u1',
  home_location_id: 'loc1',
  home_address: '10 Home St, Suburb VIC 3000',
  home_lat: null,
  home_lon: null,
  created_at: '',
  updated_at: '',
}

const onComplete = vi.fn()

// Radix UI focus guards produce a false aria-hidden-focus positive in happy-dom.
const axeNoFocusGuard = configureAxe({ rules: { 'aria-hidden-focus': { enabled: false } } })

beforeEach(() => {
  vi.clearAllMocks()
})

function fillAddress() {
  fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: '10 Home St' } })
  fireEvent.change(screen.getByLabelText(/suburb/i), { target: { value: 'Suburb' } })
  fireEvent.change(screen.getByLabelText(/state/i), { target: { value: 'VIC' } })
  fireEvent.change(screen.getByLabelText(/postcode/i), { target: { value: '3000' } })
}

describe('HomeAddressSetupModal', () => {
  it('has no accessibility violations', async () => {
    render(<HomeAddressSetupModal onComplete={onComplete} />)
    expect(await axeNoFocusGuard(document.body)).toHaveNoViolations()
  })

  it('renders the title and explanation', () => {
    render(<HomeAddressSetupModal onComplete={onComplete} />)
    expect(screen.getByRole('heading', { name: /set your home address/i })).toBeInTheDocument()
    expect(screen.getByText(/starting and ending point/i)).toBeInTheDocument()
  })

  it('renders all address fields', () => {
    render(<HomeAddressSetupModal onComplete={onComplete} />)
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/suburb/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/postcode/i)).toBeInTheDocument()
  })

  it('calls api.settings.save with the assembled address on submit', async () => {
    vi.mocked(api.settings.save).mockResolvedValue(mockSettings)
    render(<HomeAddressSetupModal onComplete={onComplete} />)

    fillAddress()
    fireEvent.submit(screen.getByRole('button', { name: /save and start planning/i }).closest('form')!)

    await waitFor(() =>
      expect(vi.mocked(api.settings.save)).toHaveBeenCalledWith('10 Home St, Suburb VIC 3000')
    )
  })

  it('calls onComplete with the returned settings on success', async () => {
    vi.mocked(api.settings.save).mockResolvedValue(mockSettings)
    render(<HomeAddressSetupModal onComplete={onComplete} />)

    fillAddress()
    fireEvent.submit(screen.getByRole('button', { name: /save and start planning/i }).closest('form')!)

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(mockSettings))
  })

  it('shows an error message when save fails', async () => {
    vi.mocked(api.settings.save).mockRejectedValue(new Error('Address not found'))
    render(<HomeAddressSetupModal onComplete={onComplete} />)

    fillAddress()
    fireEvent.submit(screen.getByRole('button', { name: /save and start planning/i }).closest('form')!)

    await waitFor(() => expect(screen.getByText('Address not found')).toBeInTheDocument())
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('disables the submit button while saving', async () => {
    let resolve: (v: AppSettings) => void
    vi.mocked(api.settings.save).mockReturnValue(new Promise((r) => { resolve = r }))
    render(<HomeAddressSetupModal onComplete={onComplete} />)

    fillAddress()
    fireEvent.submit(screen.getByRole('button', { name: /save and start planning/i }).closest('form')!)

    await waitFor(() => expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled())
    resolve!(mockSettings)
  })

  it('does not render a close button', () => {
    render(<HomeAddressSetupModal onComplete={onComplete} />)
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
  })
})
