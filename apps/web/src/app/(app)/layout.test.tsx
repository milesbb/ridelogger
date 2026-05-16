import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import AppLayout from './layout'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/drive-days',
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ accessToken: 'tok', isLoading: false, logout: vi.fn() }),
}))

describe('AppLayout nav active state', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<AppLayout>content</AppLayout>)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('marks the current route link as active', () => {
    render(<AppLayout>content</AppLayout>)
    const driveLogLinks = screen.getAllByRole('link', { name: 'Drive Log' })
    expect(driveLogLinks[0].className).toContain('font-medium')
  })

  it('does not mark other links as active', () => {
    render(<AppLayout>content</AppLayout>)
    const newDayLinks = screen.getAllByRole('link', { name: 'New Drive Day' })
    expect(newDayLinks[0].className).not.toContain('font-medium')
  })

  it('does not activate /drive when pathname is /drive-days', () => {
    render(<AppLayout>content</AppLayout>)
    const newDayLinks = screen.getAllByRole('link', { name: 'New Drive Day' })
    expect(newDayLinks[0].className).not.toContain('underline')
  })
})
