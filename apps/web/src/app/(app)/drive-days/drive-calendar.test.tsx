import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { DriveCalendar } from './drive-calendar'
import type { DriveDaySummary } from '@/lib/api/types'

const base: DriveDaySummary = {
  id: '', user_id: '', date: '', start_time: null,
  passenger_names: [], total_km: 0, total_min: 0,
  passenger_km: 0, passenger_min: 0, created_at: '', updated_at: '',
}

const day1: DriveDaySummary = {
  ...base, id: 'd1', date: '2026-05-06', passenger_names: ['Alice Smith', 'Bob Jones'],
}
const day2: DriveDaySummary = {
  ...base, id: 'd2', date: '2026-05-06', passenger_names: ['Carol White'],
}
const day3: DriveDaySummary = {
  ...base, id: 'd3', date: '2026-05-06', passenger_names: ['Dave Green'],
}

const onDayClick = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 4, 1)) // May 2026
})

describe('DriveCalendar — rendering', () => {
  it('has no accessibility violations', async () => {
    // axe uses setTimeout internally; restore real timers so the check doesn't stall.
    vi.useRealTimers()
    const { container } = render(<DriveCalendar days={[]} onDayClick={onDayClick} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders the current month label', () => {
    render(<DriveCalendar days={[]} onDayClick={onDayClick} />)
    expect(screen.getByText('May 2026')).toBeInTheDocument()
  })

  it('renders 42 day cells (6 rows × 7)', () => {
    render(<DriveCalendar days={[]} onDayClick={onDayClick} />)
    const dayCells = screen.getAllByText(/^\d+$/)
    expect(dayCells).toHaveLength(42)
  })

  it('renders a drive day rectangle in the correct cell', () => {
    render(<DriveCalendar days={[day1]} onDayClick={onDayClick} />)
    expect(screen.getByRole('button', { name: /alice smith/i })).toBeInTheDocument()
  })

  it('renders "No passengers" for a drive day with no passengers', () => {
    const noPass = { ...base, id: 'd-np', date: '2026-05-08', passenger_names: [] }
    render(<DriveCalendar days={[noPass]} onDayClick={onDayClick} />)
    expect(screen.getByRole('button', { name: /no passengers/i })).toBeInTheDocument()
  })
})

describe('DriveCalendar — clicking', () => {
  it('calls onDayClick with the correct drive day when a rectangle is clicked', () => {
    render(<DriveCalendar days={[day1]} onDayClick={onDayClick} />)
    fireEvent.click(screen.getByRole('button', { name: /alice smith/i }))
    expect(onDayClick).toHaveBeenCalledWith(day1)
  })
})

describe('DriveCalendar — multiple drives per day', () => {
  it('shows both rectangles when a date has exactly 2 drive days', () => {
    render(<DriveCalendar days={[day1, day2]} onDayClick={onDayClick} />)
    expect(screen.getByRole('button', { name: /alice smith/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /carol white/i })).toBeInTheDocument()
    expect(screen.queryByText(/more/i)).not.toBeInTheDocument()
  })

  it('shows only 2 rectangles and "+1 more" when a date has 3 drive days', () => {
    render(<DriveCalendar days={[day1, day2, day3]} onDayClick={onDayClick} />)
    expect(screen.getByRole('button', { name: /alice smith/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /carol white/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /dave green/i })).not.toBeInTheDocument()
    expect(screen.getByText('+1 more')).toBeInTheDocument()
  })
})

describe('DriveCalendar — navigation', () => {
  it('shows previous month after clicking the back arrow', () => {
    render(<DriveCalendar days={[]} onDayClick={onDayClick} />)
    fireEvent.click(screen.getByRole('button', { name: /previous month/i }))
    expect(screen.getByText('April 2026')).toBeInTheDocument()
  })

  it('shows next month after clicking the forward arrow', () => {
    render(<DriveCalendar days={[]} onDayClick={onDayClick} />)
    fireEvent.click(screen.getByRole('button', { name: /next month/i }))
    expect(screen.getByText('June 2026')).toBeInTheDocument()
  })

  it('wraps from January to December of previous year', () => {
    vi.setSystemTime(new Date(2026, 0, 1)) // January 2026
    render(<DriveCalendar days={[]} onDayClick={onDayClick} />)
    fireEvent.click(screen.getByRole('button', { name: /previous month/i }))
    expect(screen.getByText('December 2025')).toBeInTheDocument()
  })

  it('wraps from December to January of next year', () => {
    vi.setSystemTime(new Date(2026, 11, 1)) // December 2026
    render(<DriveCalendar days={[]} onDayClick={onDayClick} />)
    fireEvent.click(screen.getByRole('button', { name: /next month/i }))
    expect(screen.getByText('January 2027')).toBeInTheDocument()
  })

  it('opens the month picker when Pick month is clicked', () => {
    render(<DriveCalendar days={[]} onDayClick={onDayClick} />)
    fireEvent.click(screen.getByRole('button', { name: /pick month/i }))
    expect(screen.getByText('Jan')).toBeInTheDocument()
    expect(screen.getByText('Dec')).toBeInTheDocument()
  })

  it('selects a month from the picker and closes it', () => {
    render(<DriveCalendar days={[]} onDayClick={onDayClick} />)
    fireEvent.click(screen.getByRole('button', { name: /pick month/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Aug' }))
    expect(screen.getByText('August 2026')).toBeInTheDocument()
    expect(screen.queryByText('Jan')).not.toBeInTheDocument()
  })

  it('changes year inside the picker without affecting the calendar until a month is selected', () => {
    render(<DriveCalendar days={[]} onDayClick={onDayClick} />)
    fireEvent.click(screen.getByRole('button', { name: /pick month/i }))
    fireEvent.click(screen.getByRole('button', { name: /next year/i }))
    expect(screen.getByText('2027')).toBeInTheDocument()
    expect(screen.getByText('May 2026')).toBeInTheDocument()
  })

  it('navigates to the selected year and month on confirm', () => {
    render(<DriveCalendar days={[]} onDayClick={onDayClick} />)
    fireEvent.click(screen.getByRole('button', { name: /pick month/i }))
    fireEvent.click(screen.getByRole('button', { name: /next year/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Mar' }))
    expect(screen.getByText('March 2027')).toBeInTheDocument()
  })

  it('closes the picker when clicking outside', () => {
    render(<DriveCalendar days={[]} onDayClick={onDayClick} />)
    fireEvent.click(screen.getByRole('button', { name: /pick month/i }))
    expect(screen.getByText('Jan')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('picker-backdrop'))
    expect(screen.queryByText('Jan')).not.toBeInTheDocument()
  })
})
