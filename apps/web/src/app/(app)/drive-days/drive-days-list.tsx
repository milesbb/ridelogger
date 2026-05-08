"use client"

import { useState } from "react"
import { DriveDayDetailModal } from "./drive-day-detail-modal"
import type { DriveDaySummary } from "@/lib/api/types"

interface Props {
  days: DriveDaySummary[]
  onDayDeleted: (id: string) => void
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatTime(t: string | null): string | null {
  if (!t) return null
  const [h, m] = t.split(":")
  const hour = Number(h)
  const ampm = hour >= 12 ? "PM" : "AM"
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

interface DayGroup {
  date: string
  days: DriveDaySummary[]
}

function groupByDate(days: DriveDaySummary[]): DayGroup[] {
  const groups: DayGroup[] = []
  for (const day of days) {
    const last = groups[groups.length - 1]
    if (last && last.date === day.date) {
      last.days.push(day)
    } else {
      groups.push({ date: day.date, days: [day] })
    }
  }
  return groups
}

export function DriveDaysList({ days, onDayDeleted }: Props) {
  const [selected, setSelected] = useState<DriveDaySummary | null>(null)
  const [showNonPassenger, setShowNonPassenger] = useState(false)

  const groups = groupByDate(days)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-semibold">Drive Log</h1>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showNonPassenger}
            onChange={(e) => setShowNonPassenger(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
          />
          Include non-passenger drives
        </label>
      </div>

      {days.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No drive days saved yet. Plan and save a drive day to see it here.
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-sm font-semibold text-foreground whitespace-nowrap">{formatDate(group.date)}</p>
                <div className="flex-1 border-t" />
              </div>
              <div className="space-y-2">
                {group.days.map((day) => {
                  const km = showNonPassenger ? day.total_km : day.passenger_km
                  const min = showNonPassenger ? day.total_min : day.passenger_min
                  const displayKm = Math.round(km * 10) / 10
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => setSelected(day)}
                      className="w-full text-left border rounded-lg px-4 py-3 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {day.start_time && (
                            <p className="text-xs text-muted-foreground mb-0.5">{formatTime(day.start_time)}</p>
                          )}
                          <p className="text-sm font-medium truncate">
                            {day.passenger_names.length > 0
                              ? day.passenger_names.join(", ")
                              : <span className="text-muted-foreground">No passengers</span>}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-mono">{displayKm} km</p>
                          <p className="text-xs text-muted-foreground font-mono">{min} min</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <DriveDayDetailModal
          summary={selected}
          onClose={() => setSelected(null)}
          onDeleted={(id) => {
            onDayDeleted(id)
            setSelected(null)
          }}
        />
      )}
    </div>
  )
}
