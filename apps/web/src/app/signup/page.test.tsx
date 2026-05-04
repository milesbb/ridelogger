import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SignupPage from './page'

const mockRegister = vi.fn()
const mockPush = vi.fn()

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ register: mockRegister }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SignupPage', () => {
  it('renders email, username, and password inputs', () => {
    render(<SignupPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders a create account button', () => {
    render(<SignupPage />)
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('calls register with entered values on submit', async () => {
    mockRegister.mockResolvedValue(undefined)
    render(<SignupPage />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jo@example.com' } })
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'jo' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } })
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form')!)

    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith('jo@example.com', 'jo', 'secret'),
    )
  })

  it('redirects to /drive after successful registration', async () => {
    mockRegister.mockResolvedValue(undefined)
    render(<SignupPage />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jo@example.com' } })
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'jo' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } })
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form')!)

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/drive'))
  })

  it('displays an error message when registration fails', async () => {
    mockRegister.mockRejectedValue(new Error('Email already registered'))
    render(<SignupPage />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'taken@example.com' } })
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'jo' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass' } })
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form')!)

    await waitFor(() => expect(screen.getByText('Email already registered')).toBeInTheDocument())
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('disables the submit button while loading', async () => {
    let resolve: () => void
    mockRegister.mockReturnValue(new Promise<void>((r) => { resolve = r }))
    render(<SignupPage />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jo@example.com' } })
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'jo' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass' } })
    fireEvent.submit(screen.getByRole('button').closest('form')!)

    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled())
    resolve!()
  })

  it('has a link back to the login page', () => {
    render(<SignupPage />)
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
  })
})
