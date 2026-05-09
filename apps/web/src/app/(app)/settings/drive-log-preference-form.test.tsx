import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { DriveLogPreferenceForm } from './drive-log-preference-form'

vi.mock('@/lib/api/client', () => ({
  api: {
    preferences: {
      get: vi.fn(),
      save: vi.fn(),
    },
  },
}))

import { api } from '@/lib/api/client'

beforeEach(() => { vi.clearAllMocks() })

describe('DriveLogPreferenceForm', () => {
  it('shows List as active when drive_log_calendar_default is false', async () => {
    vi.mocked(api.preferences.get).mockResolvedValue({ drive_log_calendar_default: false, theme: 'light' as const })
    render(<DriveLogPreferenceForm />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'List' })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'List' })).not.toHaveClass('outline')
  })

  it('shows Calendar as active when drive_log_calendar_default is true', async () => {
    vi.mocked(api.preferences.get).mockResolvedValue({ drive_log_calendar_default: true, theme: 'light' as const })
    render(<DriveLogPreferenceForm />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Calendar' })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Calendar' })).not.toHaveClass('outline')
  })

  it('calls api.preferences.save(true) when Calendar button is clicked', async () => {
    vi.mocked(api.preferences.get).mockResolvedValue({ drive_log_calendar_default: false, theme: 'light' as const })
    vi.mocked(api.preferences.save).mockResolvedValue({ drive_log_calendar_default: true, theme: 'light' as const })
    render(<DriveLogPreferenceForm />)
    await waitFor(() => screen.getByRole('button', { name: 'Calendar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Calendar' }))
    expect(vi.mocked(api.preferences.save)).toHaveBeenCalledWith(true)
  })

  it('calls api.preferences.save(false) when List button is clicked', async () => {
    vi.mocked(api.preferences.get).mockResolvedValue({ drive_log_calendar_default: true, theme: 'light' as const })
    vi.mocked(api.preferences.save).mockResolvedValue({ drive_log_calendar_default: false, theme: 'light' as const })
    render(<DriveLogPreferenceForm />)
    await waitFor(() => screen.getByRole('button', { name: 'List' }))
    fireEvent.click(screen.getByRole('button', { name: 'List' }))
    expect(vi.mocked(api.preferences.save)).toHaveBeenCalledWith(false)
  })

  it('shows error when save fails', async () => {
    vi.mocked(api.preferences.get).mockResolvedValue({ drive_log_calendar_default: false, theme: 'light' as const })
    vi.mocked(api.preferences.save).mockRejectedValue(new Error('Network error'))
    render(<DriveLogPreferenceForm />)
    await waitFor(() => screen.getByRole('button', { name: 'Calendar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Calendar' }))
    await waitFor(() => expect(screen.getByText('Failed to save preference')).toBeInTheDocument())
  })
})
