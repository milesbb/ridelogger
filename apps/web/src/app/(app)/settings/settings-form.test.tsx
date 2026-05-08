import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SettingsForm } from './settings-form'
import { api } from '@/lib/api/client'
import type { AppSettings } from '@/lib/api/types'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/lib/api/client', () => ({
  api: {
    settings: {
      save: vi.fn(),
    },
  },
}))

const existingSettings: AppSettings = {
  id: 'set-1',
  user_id: 'u1',
  home_location_id: 'loc-1',
  home_address: '10 Home St, Suburb VIC 3000',
  home_lat: -37.81,
  home_lon: 144.97,
  created_at: '',
  updated_at: '',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockPush.mockReset()
})

describe('SettingsForm — rendering', () => {
  it('renders the home address input', () => {
    render(<SettingsForm existing={null} />)
    expect(screen.getByLabelText(/your home address/i)).toBeInTheDocument()
  })

  it('pre-fills address when existing settings are provided', () => {
    render(<SettingsForm existing={existingSettings} />)
    expect(screen.getByLabelText(/your home address/i)).toHaveValue('10 Home St, Suburb VIC 3000')
  })

  it('starts with empty address when no existing settings', () => {
    render(<SettingsForm existing={null} />)
    expect(screen.getByLabelText(/your home address/i)).toHaveValue('')
  })
})

describe('SettingsForm — submit', () => {
  it('calls api.settings.save with the entered address', async () => {
    vi.mocked(api.settings.save).mockResolvedValue(existingSettings)
    render(<SettingsForm existing={null} />)

    fireEvent.change(screen.getByLabelText(/your home address/i), {
      target: { value: '42 New Rd, Suburb VIC 3000' },
    })
    fireEvent.submit(screen.getByRole('button', { name: /save/i }).closest('form')!)

    await waitFor(() =>
      expect(vi.mocked(api.settings.save)).toHaveBeenCalledWith('42 New Rd, Suburb VIC 3000')
    )
  })

  it('navigates to /drive after successful save', async () => {
    vi.mocked(api.settings.save).mockResolvedValue(existingSettings)
    render(<SettingsForm existing={null} />)

    fireEvent.change(screen.getByLabelText(/your home address/i), {
      target: { value: '1 Main St' },
    })
    fireEvent.submit(screen.getByRole('button', { name: /save/i }).closest('form')!)

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/drive'))
  })

  it('shows error message when save fails', async () => {
    vi.mocked(api.settings.save).mockRejectedValue(new Error('Address not found'))
    render(<SettingsForm existing={null} />)

    fireEvent.change(screen.getByLabelText(/your home address/i), {
      target: { value: 'xyz' },
    })
    fireEvent.submit(screen.getByRole('button', { name: /save/i }).closest('form')!)

    await waitFor(() => expect(screen.getByText('Address not found')).toBeInTheDocument())
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('disables submit button while saving', async () => {
    let resolve: (v: AppSettings) => void
    vi.mocked(api.settings.save).mockReturnValue(new Promise((r) => { resolve = r }))
    render(<SettingsForm existing={null} />)

    fireEvent.change(screen.getByLabelText(/your home address/i), {
      target: { value: '1 Main St' },
    })
    fireEvent.submit(screen.getByRole('button', { name: /save/i }).closest('form')!)

    await waitFor(() => expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled())
    resolve!(existingSettings)
  })
})
