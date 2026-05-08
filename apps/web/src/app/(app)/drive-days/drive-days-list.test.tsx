import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DriveDaysList } from './drive-days-list'
import type { DriveDaySummary } from '@/lib/api/types'

vi.mock('./drive-day-detail-modal', () => ({
  DriveDayDetailModal: ({ summary, onClose }: { summary: DriveDaySummary; onClose: () => void }) => (
    <div data-testid="detail-modal">
      <span>{summary.id}</span>
      <button onClick={onClose}>Close modal</button>
    </div>
  ),
}))

vi.mock('./drive-log-export', () => ({
  DriveLogExport: () => <div data-testid="drive-log-export" />,
}))

const onDayDeleted = vi.fn()

const day1: DriveDaySummary = {
  id: 'dd-1',
  user_id: 'u1',
  date: '2026-05-06',
  start_time: '09:00',
  passenger_names: ['Alice Smith', 'Bob Jones'],
  total_km: 30,
  total_min: 55,
  passenger_km: 24.8,
  passenger_min: 44,
  created_at: '',
  updated_at: '',
}

const day2: DriveDaySummary = {
  id: 'dd-2',
  user_id: 'u1',
  date: '2026-05-06',
  start_time: null,
  passenger_names: [],
  total_km: 10,
  total_min: 18,
  passenger_km: 0,
  passenger_min: 0,
  created_at: '',
  updated_at: '',
}

const day3: DriveDaySummary = {
  id: 'dd-3',
  user_id: 'u1',
  date: '2026-04-30',
  start_time: '14:30',
  passenger_names: ['Carol White'],
  total_km: 15,
  total_min: 28,
  passenger_km: 15,
  passenger_min: 28,
  created_at: '',
  updated_at: '',
}

beforeEach(() => {
  vi.clearAllMocks()
  onDayDeleted.mockReset()
})

describe('DriveDaysList — rendering', () => {
  it('shows empty state when no days are provided', () => {
    render(<DriveDaysList days={[]} onDayDeleted={onDayDeleted} />)
    expect(screen.getByText(/no drive days saved yet/i)).toBeInTheDocument()
  })

  it('renders passenger names for each day', () => {
    render(<DriveDaysList days={[day1]} onDayDeleted={onDayDeleted} />)
    expect(screen.getByText('Alice Smith, Bob Jones')).toBeInTheDocument()
  })

  it('renders "No passengers" for days with no passengers', () => {
    render(<DriveDaysList days={[day2]} onDayDeleted={onDayDeleted} />)
    expect(screen.getByText('No passengers')).toBeInTheDocument()
  })

  it('renders the start time when present', () => {
    render(<DriveDaysList days={[day1]} onDayDeleted={onDayDeleted} />)
    expect(screen.getByText('9:00 AM')).toBeInTheDocument()
  })

  it('renders the drive log export widget', () => {
    render(<DriveDaysList days={[day1]} onDayDeleted={onDayDeleted} />)
    expect(screen.getByTestId('drive-log-export')).toBeInTheDocument()
  })
})

describe('DriveDaysList — grouping by date', () => {
  it('groups days with the same date under one heading', () => {
    render(<DriveDaysList days={[day1, day2]} onDayDeleted={onDayDeleted} />)
    const headings = screen.getAllByText(/wednesday/i)
    expect(headings).toHaveLength(1)
  })

  it('shows separate headings for days on different dates', () => {
    render(<DriveDaysList days={[day1, day3]} onDayDeleted={onDayDeleted} />)
    expect(screen.getByText(/wednesday/i)).toBeInTheDocument()
    expect(screen.getByText(/wednesday/i)).not.toBe(screen.queryByText(/april/i))
  })
})

describe('DriveDaysList — km display toggle', () => {
  it('shows passenger km by default', () => {
    render(<DriveDaysList days={[day1]} onDayDeleted={onDayDeleted} />)
    expect(screen.getByText('24.8 km')).toBeInTheDocument()
  })

  it('shows total km when Include non-passenger drives is checked', () => {
    render(<DriveDaysList days={[day1]} onDayDeleted={onDayDeleted} />)
    fireEvent.click(screen.getByLabelText(/include non-passenger drives/i))
    expect(screen.getByText('30 km')).toBeInTheDocument()
  })
})

describe('DriveDaysList — detail modal', () => {
  it('opens the detail modal when a day row is clicked', () => {
    render(<DriveDaysList days={[day1]} onDayDeleted={onDayDeleted} />)
    fireEvent.click(screen.getByRole('button', { name: /alice smith/i }))
    expect(screen.getByTestId('detail-modal')).toBeInTheDocument()
    expect(screen.getByText('dd-1')).toBeInTheDocument()
  })

  it('closes the detail modal when the modal calls onClose', () => {
    render(<DriveDaysList days={[day1]} onDayDeleted={onDayDeleted} />)
    fireEvent.click(screen.getByRole('button', { name: /alice smith/i }))
    fireEvent.click(screen.getByRole('button', { name: /close modal/i }))
    expect(screen.queryByTestId('detail-modal')).not.toBeInTheDocument()
  })
})
