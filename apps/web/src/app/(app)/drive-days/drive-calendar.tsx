"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { buildCalendarGrid, formatMonthLabel, groupByIsoDate } from "./calendar-utils"
import type { DriveDaySummary } from "@/lib/api/types"

interface Props {
  days: DriveDaySummary[]
  onDayClick: (day: DriveDaySummary) => void
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function formatDayLabel(day: DriveDaySummary): string {
  return day.passenger_names.length > 0 ? day.passenger_names.join(", ") : "No passengers"
}

function prevMonth(year: number, month: number): { year: number; month: number } {
  return month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
}

function nextMonth(year: number, month: number): { year: number; month: number } {
  return month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
}

export function DriveCalendar({ days, onDayClick }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(now.getFullYear())

  const grid = buildCalendarGrid(year, month)
  const drivesByDate = groupByIsoDate(days)

  function goBack() {
    const m = prevMonth(year, month)
    setYear(m.year)
    setMonth(m.month)
  }

  function goForward() {
    const m = nextMonth(year, month)
    setYear(m.year)
    setMonth(m.month)
  }

  function openPicker() {
    setPickerYear(year)
    setPickerOpen(true)
  }

  function selectMonth(m: number) {
    setYear(pickerYear)
    setMonth(m)
    setPickerOpen(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={goBack} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[130px] text-center">
            {formatMonthLabel(year, month)}
          </span>
          <Button variant="ghost" size="icon" onClick={goForward} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Button variant="outline" size="sm" onClick={openPicker}>
            Pick month
          </Button>

          {pickerOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setPickerOpen(false)}
                aria-hidden="true"
                data-testid="picker-backdrop"
              />
              <div className="absolute right-0 top-full mt-1 z-50 bg-background border rounded-lg shadow-lg p-3 w-52">
                <div className="flex items-center justify-between mb-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPickerYear((y) => y - 1)}
                    aria-label="Previous year"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-sm font-semibold">{pickerYear}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPickerYear((y) => y + 1)}
                    aria-label="Next year"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {MONTH_SHORT.map((name, idx) => {
                    const isSelected = pickerYear === year && idx === month
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => selectMonth(idx)}
                        className={[
                          "text-xs rounded py-1.5 transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground font-medium"
                            : "hover:bg-accent",
                        ].join(" ")}
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/30">
          {DAY_LABELS.map((label) => (
            <div key={label} className="py-1.5 text-center text-xs font-medium text-muted-foreground">
              {label}
            </div>
          ))}
        </div>

        {grid.map((row, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-7 border-t">
            {row.map((cell, colIdx) => {
              const daysForCell = cell.isoDate ? (drivesByDate.get(cell.isoDate) ?? []) : []
              const shown = daysForCell.slice(0, 2)
              const extra = daysForCell.length - 2
              const compact = daysForCell.length > 1

              return (
                <div
                  key={colIdx}
                  className={[
                    "min-h-[80px] sm:min-h-[96px] p-1 border-l first:border-l-0 flex flex-col gap-0.5",
                    cell.isWeekend ? "bg-gray-50 dark:bg-gray-800" : "bg-background",
                    !cell.isCurrentMonth ? "opacity-40" : "",
                  ].join(" ")}
                >
                  <span className="text-[10px] font-medium text-muted-foreground leading-none mb-0.5">
                    {cell.dayOfMonth}
                  </span>
                  {shown.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => onDayClick(day)}
                      className={[
                        "text-[10px] sm:text-xs truncate rounded px-1 bg-primary/10 text-primary",
                        "hover:bg-primary/20 w-full text-left transition-colors",
                        compact ? "py-0" : "py-0.5",
                      ].join(" ")}
                    >
                      {formatDayLabel(day)}
                    </button>
                  ))}
                  {extra > 0 && (
                    <span className="text-[10px] text-muted-foreground leading-none">
                      +{extra} more
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
