import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import RootPage from './page'

const mockReplace = vi.fn()
let mockAccessToken: string | null = null

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ accessToken: mockAccessToken, isLoading: false }),
}))

afterEach(() => {
  mockAccessToken = null
  mockReplace.mockReset()
})

describe('RootPage (landing page)', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<RootPage />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders the hero heading', () => {
    render(<RootPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Plan your volunteer drive day in minutes'
    )
  })

  it('renders sign in and sign up links', () => {
    render(<RootPage />)
    const signUpLinks = screen.getAllByRole('link', { name: /sign up/i })
    expect(signUpLinks.length).toBeGreaterThan(0)
    expect(signUpLinks[0]).toHaveAttribute('href', '/signup')

    const signInLinks = screen.getAllByRole('link', { name: /sign in/i })
    expect(signInLinks.length).toBeGreaterThan(0)
    expect(signInLinks[0]).toHaveAttribute('href', '/login')
  })

  it('renders all four feature headings', () => {
    render(<RootPage />)
    expect(screen.getByRole('heading', { name: 'Passenger profiles' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Named locations' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Drive planner' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Distance & time table' })).toBeInTheDocument()
  })

  it('renders the privacy policy link', () => {
    render(<RootPage />)
    const privacyLink = screen.getByRole('link', { name: /privacy policy/i })
    expect(privacyLink).toHaveAttribute('href', '/privacy')
  })

  it('redirects to /drive when user is already authenticated', async () => {
    mockAccessToken = 'test-token'
    render(<RootPage />)
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/drive')
    })
  })
})
