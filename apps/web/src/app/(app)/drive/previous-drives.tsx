"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api/client"
import type { Passenger, Location, DriveDaySummary, DriveDayDetail } from "@/lib/api/types"
import type { PassengerSlot } from "./drive-planner"

interface Props {
  date: string
  passengers: Passenger[]
  locations: Location[]
  onSelect: (slots: PassengerSlot[]) => void
}

export function buildSlotsFromDetail(
  detail: DriveDayDetail,
  passengers: Passenger[],
  locations: Location[],
): PassengerSlot[] {
  const passengerLegs = detail.legs
    .filter((l) => l.is_passenger_leg && l.passenger_id !== null)
    .sort((a, b) => a.position - b.position)

  const slots: PassengerSlot[] = []
  for (const leg of passengerLegs) {
    const passenger = passengers.find((p) => p.id === leg.passenger_id)
    const pickupLoc = locations.find((l) => l.id === leg.from_location_id)
    const dropoffLoc = locations.find((l) => l.id === leg.to_location_id)
    if (!passenger || !pickupLoc || !dropoffLoc) continue
    slots.push({
      passenger,
      pickupLocationId: pickupLoc.id,
      pickupLocationName: pickupLoc.name,
      dropoffLocationId: dropoffLoc.id,
      dropoffLocationName: dropoffLoc.name,
    })
  }
  return slots
}

function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function dayOfWeekName(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("en-AU", { weekday: "long" })
}

export function PreviousDrives({ date, passengers, locations, onSelect }: Props) {
  const [days, setDays] = useState<DriveDaySummary[]>([])
  const [selecting, setSelecting] = useState<string | null>(null)

  useEffect(() => {
    if (!date) return
    let cancelled = false
    api.drive.listSimilarDays(date)
      .then((result) => { if (!cancelled) setDays(result) })
      .catch(() => { if (!cancelled) setDays([]) })
    return () => { cancelled = true }
  }, [date])

  if (days.length === 0) return null

  async function handleSelect(summary: DriveDaySummary) {
    setSelecting(summary.id)
    try {
      const detail = await api.drive.getDay(summary.id)
      onSelect(buildSlotsFromDetail(detail, passengers, locations))
    } finally {
      setSelecting(null)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        Recent {dayOfWeekName(date)} drives
      </p>
      <div className="space-y-1.5">
        {days.map((day) => (
          <button
            key={day.id}
            type="button"
            disabled={selecting !== null}
            onClick={() => handleSelect(day)}
            className="w-full text-left border rounded-lg px-3 py-2.5 hover:bg-accent transition-colors disabled:opacity-60"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{formatShortDate(day.date)}</p>
                <p className="text-sm truncate">
                  {day.passenger_names.length > 0
                    ? day.passenger_names.join(", ")
                    : <span className="text-muted-foreground italic">No passengers</span>}
                </p>
              </div>
              <p className="text-sm font-mono shrink-0 text-muted-foreground">
                {Math.round(day.passenger_km * 10) / 10} km
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
