import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DriveResultsTable } from './drive-results-table'
import type { DriveLegResult } from '@/lib/api/types'

vi.mock('@/components/export-buttons', () => ({
  ExportButtons: () => <div data-testid="export-buttons" />,
}))

const passengerLeg: DriveLegResult = {
  label: 'Alice: pick-up → drop-off',
  distanceKm: 12.4,
  durationMin: 22,
  passengerLeg: true,
  fromLocationName: 'Home',
  toLocationName: 'Hospital',
}

const nonPassengerLeg: DriveLegResult = {
  label: 'Return to base',
  distanceKm: 5.0,
  durationMin: 10,
  passengerLeg: false,
  fromLocationName: 'Hospital',
  toLocationName: 'Home',
}

const errorLeg: DriveLegResult = {
  label: 'Bob: pick-up → drop-off',
  distanceKm: 0,
  durationMin: 0,
  passengerLeg: true,
  error: 'No route found',
}

describe('DriveResultsTable — rendering', () => {
  it('renders each leg label', () => {
    render(<DriveResultsTable results={[passengerLeg, nonPassengerLeg]} />)
    expect(screen.getByText(/Alice: pick-up → drop-off/)).toBeInTheDocument()
    expect(screen.getByText(/Return to base/)).toBeInTheDocument()
  })

  it('renders distance and duration for successful legs', () => {
    render(<DriveResultsTable results={[passengerLeg]} />)
    expect(screen.getByText('12.4')).toBeInTheDocument()
    expect(screen.getByText('22')).toBeInTheDocument()
  })

  it('renders error message for failed legs', () => {
    render(<DriveResultsTable results={[errorLeg]} />)
    expect(screen.getByText('No route found')).toBeInTheDocument()
  })

  it('shows a Total row when there are two or more successful legs', () => {
    const leg2: DriveLegResult = { label: 'Leg 2', distanceKm: 3.0, durationMin: 8, passengerLeg: true }
    render(<DriveResultsTable results={[passengerLeg, leg2]} />)
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('does not show Total row for a single successful leg', () => {
    render(<DriveResultsTable results={[passengerLeg]} />)
    expect(screen.queryByText('Total')).not.toBeInTheDocument()
  })

  it('renders the export buttons widget', () => {
    render(<DriveResultsTable results={[passengerLeg]} />)
    expect(screen.getByTestId('export-buttons')).toBeInTheDocument()
  })
})

describe('DriveResultsTable — non-passenger filter', () => {
  it('shows non-passenger legs by default', () => {
    render(<DriveResultsTable results={[passengerLeg, nonPassengerLeg]} />)
    expect(screen.getByText(/Return to base/)).toBeInTheDocument()
  })

  it('hides non-passenger legs when the checkbox is unchecked', () => {
    render(<DriveResultsTable results={[passengerLeg, nonPassengerLeg]} />)
    fireEvent.click(screen.getByLabelText(/include non-passenger drives/i))
    expect(screen.queryByText(/Return to base/)).not.toBeInTheDocument()
    expect(screen.getByText(/Alice: pick-up → drop-off/)).toBeInTheDocument()
  })

  it('restores non-passenger legs when checkbox is re-checked', () => {
    render(<DriveResultsTable results={[passengerLeg, nonPassengerLeg]} />)
    const cb = screen.getByLabelText(/include non-passenger drives/i)
    fireEvent.click(cb)
    fireEvent.click(cb)
    expect(screen.getByText(/Return to base/)).toBeInTheDocument()
  })
})

describe('DriveResultsTable — location name toggle', () => {
  it('appends location names to leg labels when Show location names is checked', () => {
    render(<DriveResultsTable results={[passengerLeg]} />)
    expect(screen.getByText(/Home → Hospital/)).toBeInTheDocument()
  })

  it('hides location names when Show location names is unchecked', () => {
    render(<DriveResultsTable results={[passengerLeg]} />)
    fireEvent.click(screen.getByLabelText(/show location names/i))
    expect(screen.queryByText(/Home → Hospital/)).not.toBeInTheDocument()
    expect(screen.getByText('Alice: pick-up → drop-off')).toBeInTheDocument()
  })
})

describe('DriveResultsTable — total calculation', () => {
  it('sums distance and duration of successful legs', () => {
    const leg2: DriveLegResult = { label: 'Leg 2', distanceKm: 3.1, durationMin: 8, passengerLeg: true }
    render(<DriveResultsTable results={[passengerLeg, leg2]} />)
    // 12.4 + 3.1 = 15.5, 22 + 8 = 30
    expect(screen.getByText('15.5')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('excludes error legs from the total', () => {
    const leg2: DriveLegResult = { label: 'Leg 2', distanceKm: 3.0, durationMin: 8, passengerLeg: true }
    render(<DriveResultsTable results={[passengerLeg, leg2, errorLeg]} />)
    // Total should only include passengerLeg + leg2
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('15.4')).toBeInTheDocument()
  })
})
