import type { DriveDaySummary } from "@/lib/api/types"

export interface CalendarCell {
  isoDate: string | null
  dayOfMonth: number
  isCurrentMonth: boolean
  isWeekend: boolean
}

export function buildCalendarGrid(year: number, month: number): CalendarCell[][] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7 // Mon=0 … Sun=6

  const cells: CalendarCell[] = []

  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    const col = (startOffset - 1 - i)
    cells.push({ isoDate: null, dayOfMonth: d.getDate(), isCurrentMonth: false, isWeekend: col === 5 || col === 6 })
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const col = (startOffset + d - 1) % 7
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    cells.push({ isoDate: iso, dayOfMonth: d, isCurrentMonth: true, isWeekend: col === 5 || col === 6 })
  }

  const baseLength = cells.length
  const remaining = 42 - baseLength
  for (let d = 1; d <= remaining; d++) {
    const col = (baseLength + d - 1) % 7
    cells.push({ isoDate: null, dayOfMonth: d, isCurrentMonth: false, isWeekend: col === 5 || col === 6 })
  }

  const rows: CalendarCell[][] = []
  for (let i = 0; i < 42; i += 7) {
    rows.push(cells.slice(i, i + 7))
  }
  return rows
}

export function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-AU", { month: "long", year: "numeric" })
}

export function groupByIsoDate(days: DriveDaySummary[]): Map<string, DriveDaySummary[]> {
  const map = new Map<string, DriveDaySummary[]>()
  for (const day of days) {
    const existing = map.get(day.date)
    if (existing) {
      existing.push(day)
    } else {
      map.set(day.date, [day])
    }
  }
  return map
}
