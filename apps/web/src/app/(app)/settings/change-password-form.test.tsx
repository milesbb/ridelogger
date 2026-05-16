import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { ChangePasswordForm } from './change-password-form'

vi.mock('@/lib/api/client', () => ({
  api: {
    auth: {
      changePassword: vi.fn(),
    },
  },
}))

import { api } from '@/lib/api/client'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ChangePasswordForm — rendering', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<ChangePasswordForm />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders all three password fields', () => {
    render(<ChangePasswordForm />)
    expect(screen.getByLabelText('Current password')).toBeInTheDocument()
    expect(screen.getByLabelText('New password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument()
  })
})

describe('ChangePasswordForm — validation', () => {
  it('shows error when new passwords do not match', async () => {
    render(<ChangePasswordForm />)

    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'old' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new1' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'new2' } })
    fireEvent.submit(screen.getByRole('button', { name: /change password/i }).closest('form')!)

    await waitFor(() => expect(screen.getByText(/do not match/i)).toBeInTheDocument())
    expect(api.auth.changePassword).not.toHaveBeenCalled()
  })
})

describe('ChangePasswordForm — submit', () => {
  it('calls api.auth.changePassword with current and new password', async () => {
    vi.mocked(api.auth.changePassword).mockResolvedValue(undefined)
    render(<ChangePasswordForm />)

    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'old-pass' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-pass' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'new-pass' } })
    fireEvent.submit(screen.getByRole('button', { name: /change password/i }).closest('form')!)

    await waitFor(() =>
      expect(api.auth.changePassword).toHaveBeenCalledWith('old-pass', 'new-pass')
    )
  })

  it('shows success message after a successful change', async () => {
    vi.mocked(api.auth.changePassword).mockResolvedValue(undefined)
    render(<ChangePasswordForm />)

    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'old' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'new' } })
    fireEvent.submit(screen.getByRole('button', { name: /change password/i }).closest('form')!)

    await waitFor(() => expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument())
  })

  it('clears the fields after a successful change', async () => {
    vi.mocked(api.auth.changePassword).mockResolvedValue(undefined)
    render(<ChangePasswordForm />)

    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'old' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'new' } })
    fireEvent.submit(screen.getByRole('button', { name: /change password/i }).closest('form')!)

    await waitFor(() => expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument())
    expect(screen.getByLabelText('Current password')).toHaveValue('')
    expect(screen.getByLabelText('New password')).toHaveValue('')
  })

  it('shows API error message on failure', async () => {
    vi.mocked(api.auth.changePassword).mockRejectedValue(new Error('Invalid email or password'))
    render(<ChangePasswordForm />)

    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'wrong' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'new' } })
    fireEvent.submit(screen.getByRole('button', { name: /change password/i }).closest('form')!)

    await waitFor(() => expect(screen.getByText('Invalid email or password')).toBeInTheDocument())
  })

  it('disables the submit button while loading', async () => {
    let resolve: (v: undefined) => void
    vi.mocked(api.auth.changePassword).mockReturnValue(new Promise((r) => { resolve = r as (v: undefined) => void }))
    render(<ChangePasswordForm />)

    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'old' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'new' } })
    fireEvent.submit(screen.getByRole('button', { name: /change password/i }).closest('form')!)

    await waitFor(() => expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled())
    resolve!(undefined)
  })
})
