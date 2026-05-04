"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DestinationPicker } from "./destination-picker"
import { api } from "@/lib/api/client"
import type { Passenger, Location, DriveSegmentResult } from "@/lib/api/types"

interface Props {
  passengers: Passenger[]
  locations: Location[]
  onLocationsChange: (locations: Location[]) => void
}

interface PassengerSlot {
  passenger: Passenger
  destinationId: string | null
  destinationName: string | null
  pickerOpen: boolean
}

export function DrivePlanner({ passengers, locations, onLocationsChange }: Props) {
  const [slots, setSlots] = useState<PassengerSlot[]>([])
  const [results, setResults] = useState<DriveSegmentResult[] | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [calcError, setCalcError] = useState("")

  function togglePassenger(p: Passenger) {
    setResults(null)
    setSlots((prev) => {
      const exists = prev.find((s) => s.passenger.id === p.id)
      if (exists) return prev.filter((s) => s.passenger.id !== p.id)
      return [...prev, { passenger: p, destinationId: null, destinationName: null, pickerOpen: false }]
    })
  }

  function openPicker(passengerId: string) {
    setSlots((prev) => prev.map((s) => ({ ...s, pickerOpen: s.passenger.id === passengerId })))
  }

  function closePicker(passengerId: string) {
    setSlots((prev) => prev.map((s) => (s.passenger.id === passengerId ? { ...s, pickerOpen: false } : s)))
  }

  function setDestination(passengerId: string, locationId: string, locationName: string) {
    setResults(null)
    setSlots((prev) =>
      prev.map((s) =>
        s.passenger.id === passengerId
          ? { ...s, destinationId: locationId, destinationName: locationName }
          : s,
      ),
    )
  }

  function moveSlot(index: number, dir: -1 | 1) {
    setSlots((prev) => {
      const next = [...prev]
      const swap = index + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[index], next[swap]] = [next[swap], next[index]]
      return next
    })
  }

  const readyToCalculate = slots.length > 0 && slots.every((s) => s.destinationId)

  async function handleCalculate() {
    setCalculating(true)
    setCalcError("")
    try {
      const res = await api.drive.calculate(
        slots.map((s) => ({ passengerId: s.passenger.id, destinationLocationId: s.destinationId! })),
      )
      setResults(res)
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : "Calculation failed")
    } finally {
      setCalculating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Drive Day</h1>
        <p className="text-sm text-muted-foreground mt-1">Select passengers, set destinations, then calculate.</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">1. Select passengers</p>
        {passengers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No passengers saved yet. <a href="/passengers" className="underline">Add one first.</a></p>
        ) : (
          <div className="space-y-2">
            {passengers.map((p) => {
              const selected = slots.some((s) => s.passenger.id === p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePassenger(p)}
                  className={`w-full text-left border rounded-lg px-4 py-3 transition-colors ${selected ? "border-primary bg-primary/5" : "border-border hover:bg-accent"}`}
                >
                  <span className="font-medium text-sm">{p.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{selected ? "✓ selected" : ""}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {slots.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">2. Set destination for each passenger</p>
          <p className="text-xs text-muted-foreground">Tap a passenger to pick their destination. Use arrows to reorder.</p>
          <div className="space-y-2">
            {slots.map((slot, i) => (
              <div key={slot.passenger.id} className="border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button type="button" onClick={() => moveSlot(i, -1)} disabled={i === 0} className="text-muted-foreground disabled:opacity-20 hover:text-foreground">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => moveSlot(i, 1)} disabled={i === slots.length - 1} className="text-muted-foreground disabled:opacity-20 hover:text-foreground">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{slot.passenger.name}</p>
                    {slot.destinationName ? (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />{slot.destinationName}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">No destination set</p>
                    )}
                  </div>
                  <Button type="button" variant={slot.destinationId ? "outline" : "default"} size="sm" onClick={() => openPicker(slot.passenger.id)}>
                    {slot.destinationId ? "Change" : "Set destination"}
                  </Button>
                </div>
                <DestinationPicker
                  open={slot.pickerOpen}
                  onClose={() => closePicker(slot.passenger.id)}
                  locations={locations}
                  passengerHomeAddress={slot.passenger.home_address}
                  passengerHomeId={`home-${slot.passenger.id}`}
                  selected={slot.destinationId}
                  onSelect={(id, name) => setDestination(slot.passenger.id, id, name)}
                  onLocationAdded={(loc) => onLocationsChange([...locations, loc])}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {slots.length > 0 && (
        <div className="space-y-2">
          {calcError && <p className="text-sm text-destructive">{calcError}</p>}
          <Button onClick={handleCalculate} disabled={!readyToCalculate || calculating} className="w-full">
            {calculating ? "Calculating…" : "Calculate distances"}
          </Button>
          {!readyToCalculate && slots.some((s) => !s.destinationId) && (
            <p className="text-xs text-muted-foreground text-center">Set a destination for each passenger first.</p>
          )}
        </div>
      )}

      {results && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Results</p>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">Passenger</th>
                  <th className="text-left px-4 py-2 font-medium">Destination</th>
                  <th className="text-right px-4 py-2 font-medium">km</th>
                  <th className="text-right px-4 py-2 font-medium">min</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.passengerId} className="border-b last:border-0">
                    <td className="px-4 py-2">{r.passengerName}</td>
                    <td className="px-4 py-2 text-muted-foreground">{r.destinationName}</td>
                    {r.error ? (
                      <td colSpan={2} className="px-4 py-2 text-destructive text-xs">{r.error}</td>
                    ) : (
                      <>
                        <td className="px-4 py-2 text-right font-mono">{r.distanceKm}</td>
                        <td className="px-4 py-2 text-right font-mono">{r.durationMin}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
              {results.filter((r) => !r.error).length > 1 && (
                <tfoot>
                  <tr className="bg-muted/50 font-medium">
                    <td className="px-4 py-2" colSpan={2}>Total</td>
                    <td className="px-4 py-2 text-right font-mono">
                      {Math.round(results.filter((r) => !r.error).reduce((s, r) => s + r.distanceKm, 0) * 10) / 10}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {results.filter((r) => !r.error).reduce((s, r) => s + r.durationMin, 0)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <p className="text-xs text-muted-foreground">Distances and times include both outbound and return legs.</p>
        </div>
      )}
    </div>
  )
}
