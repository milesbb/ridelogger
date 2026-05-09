import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { ThemePreferenceForm } from './theme-preference-form'

vi.mock('@/lib/api/client', () => ({
  api: {
    preferences: {
      get: vi.fn(),
      saveTheme: vi.fn(),
    },
  },
}))

const mockSetTheme = vi.fn()
let mockTheme: 'light' | 'dark' = 'light'

vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ theme: mockTheme, setTheme: mockSetTheme }),
}))

import { api } from '@/lib/api/client'

beforeEach(() => {
  vi.clearAllMocks()
  mockTheme = 'light'
})

describe('ThemePreferenceForm', () => {
  it('shows Light as selected when theme is light', async () => {
    vi.mocked(api.preferences.get).mockResolvedValue({ drive_log_calendar_default: false, theme: 'light' })
    render(<ThemePreferenceForm />)
    await waitFor(() => expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /light/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /dark/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows Dark as selected when theme is dark', async () => {
    mockTheme = 'dark'
    vi.mocked(api.preferences.get).mockResolvedValue({ drive_log_calendar_default: false, theme: 'dark' })
    render(<ThemePreferenceForm />)
    await waitFor(() => expect(screen.getByRole('button', { name: /dark/i })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /dark/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /light/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls setTheme and saveTheme when Dark is clicked', async () => {
    vi.mocked(api.preferences.get).mockResolvedValue({ drive_log_calendar_default: false, theme: 'light' })
    vi.mocked(api.preferences.saveTheme).mockResolvedValue({ drive_log_calendar_default: false, theme: 'dark' })
    render(<ThemePreferenceForm />)
    await waitFor(() => screen.getByRole('button', { name: /dark/i }))
    fireEvent.click(screen.getByRole('button', { name: /dark/i }))
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
    expect(vi.mocked(api.preferences.saveTheme)).toHaveBeenCalledWith('dark')
  })

  it('calls setTheme and saveTheme when Light is clicked', async () => {
    mockTheme = 'dark'
    vi.mocked(api.preferences.get).mockResolvedValue({ drive_log_calendar_default: false, theme: 'dark' })
    vi.mocked(api.preferences.saveTheme).mockResolvedValue({ drive_log_calendar_default: false, theme: 'light' })
    render(<ThemePreferenceForm />)
    await waitFor(() => screen.getByRole('button', { name: /light/i }))
    fireEvent.click(screen.getByRole('button', { name: /light/i }))
    expect(mockSetTheme).toHaveBeenCalledWith('light')
    expect(vi.mocked(api.preferences.saveTheme)).toHaveBeenCalledWith('light')
  })

  it('shows error when save fails', async () => {
    vi.mocked(api.preferences.get).mockResolvedValue({ drive_log_calendar_default: false, theme: 'light' })
    vi.mocked(api.preferences.saveTheme).mockRejectedValue(new Error('Network error'))
    render(<ThemePreferenceForm />)
    await waitFor(() => screen.getByRole('button', { name: /dark/i }))
    fireEvent.click(screen.getByRole('button', { name: /dark/i }))
    await waitFor(() => expect(screen.getByText('Failed to save theme preference')).toBeInTheDocument())
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('calls setTheme on mount when DB theme differs from context', async () => {
    mockTheme = 'light'
    vi.mocked(api.preferences.get).mockResolvedValue({ drive_log_calendar_default: false, theme: 'dark' })
    render(<ThemePreferenceForm />)
    await waitFor(() => expect(vi.mocked(api.preferences.get)).toHaveBeenCalled())
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('does not call setTheme on mount when DB theme matches context', async () => {
    mockTheme = 'light'
    vi.mocked(api.preferences.get).mockResolvedValue({ drive_log_calendar_default: false, theme: 'light' })
    render(<ThemePreferenceForm />)
    await waitFor(() => expect(vi.mocked(api.preferences.get)).toHaveBeenCalled())
    expect(mockSetTheme).not.toHaveBeenCalled()
  })
})
