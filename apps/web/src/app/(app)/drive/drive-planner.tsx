"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, MapPin, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DestinationPicker } from "./destination-picker"
import { api } from "@/lib/api/client"
import type { Passenger, Location, AppSettings, DriveLegInput, DriveLegResult } from "@/lib/api/types"

interface Props {
  passengers: Passenger[]
  locations: Location[]
  settings: AppSettings
  onLocationsChange: (locations: Location[]) => void
}

interface PassengerSlot {
  passenger: Passenger
  pickupLocationId: string
  pickupLocationName: string
  dropoffLocationId: string | null
  dropoffLocationName: string | null
}

type PickerTarget = { slotIndex: number; field: "pickup" | "dropoff" }

function buildLegs(slots: PassengerSlot[], homeLocationId: string): DriveLegInput[] {
  const legs: DriveLegInput[] = []
  if (slots.length === 0) return legs

  legs.push({
    fromLocationId: homeLocationId,
    toLocationId: slots[0].pickupLocationId,
    label: `Home → ${slots[0].pickupLocationName}`,
  })

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    legs.push({
      fromLocationId: slot.pickupLocationId,
      toLocationId: slot.dropoffLocationId!,
      label: `${slot.passenger.name}: pick-up → drop-off`,
    })
    legs.push({
      fromLocationId: slot.dropoffLocationId!,
      toLocationId: slot.pickupLocationId,
      label: `${slot.passenger.name}: drop-off → pick-up`,
    })
    if (i < slots.length - 1) {
      legs.push({
        fromLocationId: slot.pickupLocationId,
        toLocationId: slots[i + 1].pickupLocationId,
        label: `${slot.pickupLocationName} → ${slots[i + 1].pickupLocationName}`,
      })
    }
  }

  const last = slots[slots.length - 1]
  legs.push({
    fromLocationId: last.pickupLocationId,
    toLocationId: homeLocationId,
    label: `${last.pickupLocationName} → Home`,
  })

  return legs
}

export function DrivePlanner({ passengers, locations, settings, onLocationsChange }: Props) {
  const [slots, setSlots] = useState<PassengerSlot[]>([])
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null)
  const [results, setResults] = useState<DriveLegResult[] | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [calcError, setCalcError] = useState("")

  const selectedIds = new Set(slots.map((s) => s.passenger.id))
  const unselectedPassengers = passengers.filter((p) => !selectedIds.has(p.id))
  const lastSlotComplete = slots.length > 0 && slots[slots.length - 1].dropoffLocationId !== null
  const allSlotsComplete = slots.length > 0 && slots.every((s) => s.dropoffLocationId !== null)

  function addPassenger(p: Passenger) {
    const homeLocation = locations.find((l) => l.id === p.home_location_id)
    setResults(null)
    setSlots((prev) => [
      ...prev,
      {
        passenger: p,
        pickupLocationId: p.home_location_id,
        pickupLocationName: homeLocation?.name ?? p.home_address,
        dropoffLocationId: null,
        dropoffLocationName: null,
      },
    ])
  }

  function removePassenger(id: string) {
    setResults(null)
    setSlots((prev) => prev.filter((s) => s.passenger.id !== id))
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

  function setPickerSelection(locationId: string, locationName: string) {
    if (!pickerTarget) return
    const { slotIndex, field } = pickerTarget
    setResults(null)
    setSlots((prev) =>
      prev.map((s, i) =>
        i !== slotIndex ? s :
        field === "pickup"
          ? { ...s, pickupLocationId: locationId, pickupLocationName: locationName }
          : { ...s, dropoffLocationId: locationId, dropoffLocationName: locationName },
      ),
    )
  }

  async function handleFinishDay() {
    setCalculating(true)
    setCalcError("")
    try {
      const legs = buildLegs(slots, settings.home_location_id)
      const res = await api.drive.calculate(legs)
      setResults(res)
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : "Calculation failed")
    } finally {
      setCalculating(false)
    }
  }

  const activeSlot = pickerTarget !== null ? slots[pickerTarget.slotIndex] : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Drive Day</h1>
        <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
          <Home className="h-3.5 w-3.5 shrink-0" />
          <span>Starting from: {settings.home_address}</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Passengers</p>
        {passengers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No passengers saved yet. <a href="/passengers" className="underline">Add one first.</a>
          </p>
        ) : unselectedPassengers.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Select a passenger to add them to the day:</p>
            <div className="flex flex-wrap gap-2">
              {unselectedPassengers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addPassenger(p)}
                  className="border rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        ) : slots.length > 0 ? (
          <p className="text-xs text-muted-foreground">All passengers added.</p>
        ) : null}
      </div>

      {slots.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Trip order</p>
          <div className="space-y-2">
            {slots.map((slot, i) => (
              <div key={slot.passenger.id} className="border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button type="button" onClick={() => moveSlot(i, -1)} disabled={i === 0} className="text-muted-foreground disabled:opacity-20 hover:text-foreground">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => moveSlot(i, 1)} disabled={i === slots.length - 1} className="text-muted-foreground disabled:opacity-20 hover:text-foreground">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="flex-1 font-medium text-sm">{slot.passenger.name}</p>
                  <button
                    type="button"
                    onClick={() => removePassenger(slot.passenger.id)}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Remove
                  </button>
                </div>

                <div className="divide-y">
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Pick-up</p>
                      <p className="text-sm font-medium truncate">{slot.pickupLocationName}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setPickerTarget({ slotIndex: i, field: "pickup" })}>
                      Change
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Drop-off</p>
                      {slot.dropoffLocationName ? (
                        <p className="text-sm font-medium truncate">{slot.dropoffLocationName}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not set</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant={slot.dropoffLocationId ? "outline" : "default"}
                      size="sm"
                      onClick={() => setPickerTarget({ slotIndex: i, field: "dropoff" })}
                    >
                      {slot.dropoffLocationId ? "Change" : "Set"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lastSlotComplete && (
        <div className="space-y-2">
          {calcError && <p className="text-sm text-destructive">{calcError}</p>}
          <div className="flex flex-col sm:flex-row gap-2">
            {unselectedPassengers.length > 0 && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const next = unselectedPassengers[0]
                  addPassenger(next)
                  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
                }}
              >
                Add another passenger
              </Button>
            )}
            <Button
              onClick={handleFinishDay}
              disabled={!allSlotsComplete || calculating}
              className="flex-1"
            >
              {calculating ? "Calculating…" : "Finish day"}
            </Button>
          </div>
          {!allSlotsComplete && (
            <p className="text-xs text-muted-foreground text-center">Set all drop-off addresses first.</p>
          )}
        </div>
      )}

      {results && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Results</p>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">Leg</th>
                  <th className="text-right px-4 py-2 font-medium">km</th>
                  <th className="text-right px-4 py-2 font-medium">min</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-2 text-muted-foreground">{r.label}</td>
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
                    <td className="px-4 py-2">Total</td>
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
        </div>
      )}

      {pickerTarget !== null && activeSlot && (
        <DestinationPicker
          open
          onClose={() => setPickerTarget(null)}
          locations={locations}
          passengerHomeLocationIds={
            pickerTarget.field === "pickup"
              ? [activeSlot.passenger.home_location_id]
              : slots.map((s) => s.passenger.home_location_id)
          }
          selected={
            pickerTarget.field === "pickup"
              ? activeSlot.pickupLocationId
              : activeSlot.dropoffLocationId
          }
          onSelect={setPickerSelection}
          onLocationAdded={(loc) => onLocationsChange([...locations, loc])}
        />
      )}
    </div>
  )
}
