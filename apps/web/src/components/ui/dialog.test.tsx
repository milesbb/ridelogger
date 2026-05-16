import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { configureAxe } from 'vitest-axe'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog'

const axe = configureAxe({ rules: { 'aria-hidden-focus': { enabled: false } } })

function TestDialog({ open = true }: { open?: boolean }) {
  return (
    <Dialog open={open}>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Test dialog</DialogTitle>
        </DialogHeader>
        <p>Dialog content</p>
      </DialogContent>
    </Dialog>
  )
}

describe('DialogContent', () => {
  it('has no accessibility violations', async () => {
    render(<TestDialog open />)
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('renders children when open', () => {
    render(<TestDialog open />)
    expect(screen.getByText('Test dialog')).toBeInTheDocument()
    expect(screen.getByText('Dialog content')).toBeInTheDocument()
  })

  it('applies max-h-[90dvh] and overflow-y-auto for mobile keyboard scrollability', () => {
    render(<TestDialog open />)
    const content = document.querySelector('[role="dialog"]')
    expect(content?.className).toContain('max-h-[90dvh]')
    expect(content?.className).toContain('overflow-y-auto')
  })
})
