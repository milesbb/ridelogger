import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeleteAccountSection } from './delete-account-section'

vi.mock('@/lib/api/client', () => ({
  api: {
    auth: {
      deleteAccount: vi.fn(),
    },
  },
  clearToken: vi.fn(),
}))

import { api, clearToken } from '@/lib/api/client'

const mockHref = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(window, 'location', {
    value: { href: '' },
    writable: true,
    configurable: true,
  })
  Object.defineProperty(window.location, 'href', {
    set: mockHref,
    configurable: true,
  })
})

describe('DeleteAccountSection — rendering', () => {
  it('renders the Delete account button', () => {
    render(<DeleteAccountSection />)
    expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument()
  })

  it('does not show the dialog initially', () => {
    render(<DeleteAccountSection />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('DeleteAccountSection — dialog', () => {
  it('opens the dialog when Delete account is clicked', async () => {
    render(<DeleteAccountSection />)

    fireEvent.click(screen.getByRole('button', { name: /delete account/i }))

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('clears password and error when dialog is closed', async () => {
    render(<DeleteAccountSection />)

    fireEvent.click(screen.getByRole('button', { name: /delete account/i }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /delete account/i }))
    await waitFor(() => expect(screen.getByLabelText(/password/i)).toHaveValue(''))
  })
})

describe('DeleteAccountSection — confirmation', () => {
  async function openDialog() {
    render(<DeleteAccountSection />)
    fireEvent.click(screen.getByRole('button', { name: /delete account/i }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
  }

  it('calls api.auth.deleteAccount with the entered password', async () => {
    vi.mocked(api.auth.deleteAccount).mockResolvedValue(undefined)
    await openDialog()

    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'my-secret' } })
    fireEvent.submit(screen.getByRole('button', { name: /delete my account/i }).closest('form')!)

    await waitFor(() => expect(api.auth.deleteAccount).toHaveBeenCalledWith('my-secret'))
  })

  it('clears token and redirects to /login on success', async () => {
    vi.mocked(api.auth.deleteAccount).mockResolvedValue(undefined)
    await openDialog()

    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } })
    fireEvent.submit(screen.getByRole('button', { name: /delete my account/i }).closest('form')!)

    await waitFor(() => expect(vi.mocked(clearToken)).toHaveBeenCalled())
    expect(mockHref).toHaveBeenCalledWith('/login')
  })

  it('shows error message when deletion fails', async () => {
    vi.mocked(api.auth.deleteAccount).mockRejectedValue(new Error('Invalid email or password'))
    await openDialog()

    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } })
    fireEvent.submit(screen.getByRole('button', { name: /delete my account/i }).closest('form')!)

    await waitFor(() => expect(screen.getByText('Invalid email or password')).toBeInTheDocument())
    expect(vi.mocked(clearToken)).not.toHaveBeenCalled()
  })
})
