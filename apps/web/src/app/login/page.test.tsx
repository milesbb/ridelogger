import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import LoginPage from './page'

const mockLogin = vi.fn()
const mockPush = vi.fn()

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LoginPage', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<LoginPage />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders email/username and password inputs', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders a sign in button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('calls login with entered credentials on submit', async () => {
    mockLogin.mockResolvedValue(undefined)
    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/email or username/i), { target: { value: 'jo' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } })
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!)

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('jo', 'secret'))
  })

  it('redirects to /drive after successful login', async () => {
    mockLogin.mockResolvedValue(undefined)
    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/email or username/i), { target: { value: 'jo' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } })
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!)

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/drive'))
  })

  it('displays an error message when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'))
    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/email or username/i), { target: { value: 'jo' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } })
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!)

    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument())
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('disables the submit button while loading', async () => {
    let resolve: () => void
    mockLogin.mockReturnValue(new Promise<void>((r) => { resolve = r }))
    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/email or username/i), { target: { value: 'jo' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass' } })
    fireEvent.submit(screen.getByRole('button').closest('form')!)

    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled())
    resolve!()
  })

  it('has a link to the signup page', () => {
    render(<LoginPage />)
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup')
  })
})
