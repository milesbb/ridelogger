"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronUp, GripVertical, MapPin, Home, Pencil, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DestinationPicker } from "./destination-picker"
import { PreviousDrives, buildSlotsFromDetail } from "./previous-drives"
import { PassengerForm } from "@/app/(app)/passengers/passenger-form"
import { api } from "@/lib/api/client"
import { DriveResultsTable } from "./drive-results-table"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Passenger, Location, AppSettings, DriveLegInput, DriveLegResult, SaveLegInput, DriveDayDetail } from "@/lib/api/types"

interface Props {
  passengers: Passenger[]
  locations: Location[]
  settings: AppSettings
  onLocationsChange: (locations: Location[]) => void
  onPassengersChange: (passengers: Passenger[]) => void
  initialDayDetail?: DriveDayDetail
}

export interface PassengerSlot {
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
    passengerLeg: false,
  })

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    legs.push({
      fromLocationId: slot.pickupLocationId,
      toLocationId: slot.dropoffLocationId!,
      label: `${slot.passenger.name}: pick-up → drop-off`,
      passengerLeg: true,
    })
    legs.push({
      fromLocationId: slot.dropoffLocationId!,
      toLocationId: slot.pickupLocationId,
      label: `${slot.passenger.name}: drop-off → pick-up`,
      passengerLeg: false,
    })
    if (i < slots.length - 1) {
      legs.push({
        fromLocationId: slot.pickupLocationId,
        toLocationId: slots[i + 1].pickupLocationId,
        label: `${slot.pickupLocationName} → ${slots[i + 1].pickupLocationName}`,
        passengerLeg: false,
      })
    }
  }

  const last = slots[slots.length - 1]
  legs.push({
    fromLocationId: last.pickupLocationId,
    toLocationId: homeLocationId,
    label: `${last.pickupLocationName} → Home`,
    passengerLeg: false,
  })

  return legs
}

function buildSaveLegs(
  slots: PassengerSlot[],
  homeLocationId: string,
  results: DriveLegResult[],
): SaveLegInput[] {
  const saveLegs: SaveLegInput[] = []
  if (slots.length === 0) return saveLegs

  let ri = 0

  saveLegs.push({
    fromLocationId: homeLocationId,
    toLocationId: slots[0].pickupLocationId,
    passengerId: null,
    label: `Home → ${slots[0].pickupLocationName}`,
    distanceKm: results[ri]?.distanceKm ?? 0,
    durationMin: results[ri]?.durationMin ?? 0,
    isPassengerLeg: false,
  })
  ri++

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    saveLegs.push({
      fromLocationId: slot.pickupLocationId,
      toLocationId: slot.dropoffLocationId!,
      passengerId: slot.passenger.id,
      label: `${slot.passenger.name}: pick-up → drop-off`,
      distanceKm: results[ri]?.distanceKm ?? 0,
      durationMin: results[ri]?.durationMin ?? 0,
      isPassengerLeg: true,
    })
    ri++
    saveLegs.push({
      fromLocationId: slot.dropoffLocationId!,
      toLocationId: slot.pickupLocationId,
      passengerId: null,
      label: `${slot.passenger.name}: drop-off → pick-up`,
      distanceKm: results[ri]?.distanceKm ?? 0,
      durationMin: results[ri]?.durationMin ?? 0,
      isPassengerLeg: false,
    })
    ri++
    if (i < slots.length - 1) {
      saveLegs.push({
        fromLocationId: slot.pickupLocationId,
        toLocationId: slots[i + 1].pickupLocationId,
        passengerId: null,
        label: `${slot.pickupLocationName} → ${slots[i + 1].pickupLocationName}`,
        distanceKm: results[ri]?.distanceKm ?? 0,
        durationMin: results[ri]?.durationMin ?? 0,
        isPassengerLeg: false,
      })
      ri++
    }
  }

  const last = slots[slots.length - 1]
  saveLegs.push({
    fromLocationId: last.pickupLocationId,
    toLocationId: homeLocationId,
    passengerId: null,
    label: `${last.pickupLocationName} → Home`,
    distanceKm: results[ri]?.distanceKm ?? 0,
    durationMin: results[ri]?.durationMin ?? 0,
    isPassengerLeg: false,
  })

  return saveLegs
}

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function formatDateHeader(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

interface DateButtonProps {
  date: string
  onDateChange: (d: string) => void
}

function DateButton({ date, onDateChange }: DateButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xl font-semibold underline decoration-dashed underline-offset-4 hover:text-muted-foreground transition-colors flex items-center gap-1"
      >
        {formatDateHeader(date)}
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-10 bg-background border rounded-lg shadow-md p-3">
          <input
            type="date"
            value={date}
            onChange={(e) => {
              if (e.target.value) {
                onDateChange(e.target.value)
                setOpen(false)
              }
            }}
            className="border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
        </div>
      )}
    </div>
  )
}

interface SaveSectionProps {
  date: string
  legsForSave: SaveLegInput[]
  onSaved: () => void
}

function SaveSection({ date, legsForSave, onSaved }: SaveSectionProps) {
  const [startTime, setStartTime] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSaveError("")
    try {
      await api.drive.save({ date, startTime: startTime || null, legs: legsForSave })
      setSaved(true)
      setTimeout(onSaved, 800)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return <p className="text-sm text-center text-muted-foreground">Drive day saved.</p>
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium">Save drive day</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">Start time (optional)</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="Optional"
            className="w-full border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      {saveError && <p className="text-sm text-destructive">{saveError}</p>}
      <Button onClick={handleSave} disabled={saving || !date} className="w-full sm:w-auto">
        {saving ? "Saving…" : "Save drive day"}
      </Button>
    </div>
  )
}

interface SortableSlotCardProps {
  slot: PassengerSlot
  index: number
  totalSlots: number
  onMoveSlot: (index: number, dir: -1 | 1) => void
  onRemove: (id: string) => void
  onSetPickerTarget: (target: PickerTarget) => void
}

function SortableSlotCard({ slot, index, totalSlots, onMoveSlot, onRemove, onSetPickerTarget }: SortableSlotCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: slot.passenger.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg overflow-hidden">
      <div
        className="bg-muted/30 border-b cursor-grab active:cursor-grabbing touch-none select-none"
        {...listeners}
        {...attributes}
        aria-label="Drag to reorder"
      >
        <div className="flex justify-center pt-1.5 pb-0.5">
          <GripVertical className="h-4 w-4 text-muted-foreground/60" />
        </div>
        <div className="flex items-center gap-2 px-4 py-2">
          <div
            className="flex flex-col gap-0.5 shrink-0"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Move up"
              onClick={() => onMoveSlot(index, -1)}
              disabled={index === 0}
              className="text-muted-foreground disabled:opacity-20 hover:text-foreground"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Move down"
              onClick={() => onMoveSlot(index, 1)}
              disabled={index === totalSlots - 1}
              className="text-muted-foreground disabled:opacity-20 hover:text-foreground"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <p className="flex-1 font-medium text-sm">{slot.passenger.name}</p>
          <button
            type="button"
            onClick={() => onRemove(slot.passenger.id)}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="divide-y">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Pick-up</p>
            <p className="text-sm font-medium truncate">{slot.pickupLocationName}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSetPickerTarget({ slotIndex: index, field: "pickup" })}
          >
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
            onClick={() => onSetPickerTarget({ slotIndex: index, field: "dropoff" })}
          >
            {slot.dropoffLocationId ? "Change" : "Set"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function DrivePlanner({ passengers, locations, settings, onLocationsChange, onPassengersChange, initialDayDetail }: Props) {
  const [date, setDate] = useState(todayLocal)
  const [slots, setSlots] = useState<PassengerSlot[]>([])
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null)
  const [dropoffSuggestions, setDropoffSuggestions] = useState<Location[]>([])
  const [results, setResults] = useState<DriveLegResult[] | null>(null)
  const [legsForSave, setLegsForSave] = useState<SaveLegInput[] | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [calcError, setCalcError] = useState("")
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [passengerSearch, setPassengerSearch] = useState("")

  useEffect(() => {
    if (!initialDayDetail || passengers.length === 0 || locations.length === 0) return
    const populated = buildSlotsFromDetail(initialDayDetail, passengers, locations)
    if (populated.length > 0) setSlots(populated)
  }, [initialDayDetail, passengers, locations])

  useEffect(() => {
    if (pickerTarget?.field !== "dropoff") {
      setDropoffSuggestions([])
      return
    }
    const passenger = slots[pickerTarget.slotIndex]?.passenger
    if (!passenger) return
    let cancelled = false
    api.drive.getPassengerDropoffs(passenger.id)
      .then((locs) => { if (!cancelled) setDropoffSuggestions(locs) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [pickerTarget, slots])

  const selectedIds = new Set(slots.map((s) => s.passenger.id))
  const unselectedPassengers = passengers.filter((p) => !selectedIds.has(p.id))
  const lastSlotComplete = slots.length > 0 && slots[slots.length - 1].dropoffLocationId !== null
  const allSlotsComplete = slots.length > 0 && slots.every((s) => s.dropoffLocationId !== null)

  async function handleQuickAddDone() {
    setQuickAddOpen(false)
    const fresh = await api.passengers.list()
    onPassengersChange(fresh)
  }

  function addPassenger(p: Passenger) {
    const homeLocation = locations.find((l) => l.id === p.home_location_id)
    setPassengerSearch("")
    setResults(null)
    setLegsForSave(null)
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
    setLegsForSave(null)
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

  const sensors = useSensors(useSensor(PointerSensor))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = slots.findIndex((s) => s.passenger.id === active.id)
    const newIndex = slots.findIndex((s) => s.passenger.id === over.id)
    setSlots((prev) => arrayMove(prev, oldIndex, newIndex))
  }

  function setPickerSelection(locationId: string, locationName: string) {
    if (!pickerTarget) return
    const { slotIndex, field } = pickerTarget
    setResults(null)
    setLegsForSave(null)
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
      const mapped = res.map((r, i) => ({
        ...r,
        passengerLeg: legs[i]?.passengerLeg ?? false,
        fromLocationName: locations.find((l) => l.id === legs[i]?.fromLocationId)?.name,
        toLocationName: locations.find((l) => l.id === legs[i]?.toLocationId)?.name,
      }))
      setResults(mapped)
      setLegsForSave(buildSaveLegs(slots, settings.home_location_id, mapped))
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : "Calculation failed")
    } finally {
      setCalculating(false)
    }
  }

  function handleSaved() {
    setResults(null)
    setLegsForSave(null)
    setSlots([])
  }

  const activeSlot = pickerTarget !== null ? slots[pickerTarget.slotIndex] : null

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xl font-semibold whitespace-nowrap">Drive Day on</span>
          <DateButton date={date} onDateChange={(d) => {
            setDate(d)
            setResults(null)
            setLegsForSave(null)
          }} />
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
          <Home className="h-3.5 w-3.5 shrink-0" />
          <span>Starting from: {settings.home_address}</span>
        </div>
      </div>

      <PreviousDrives
        date={date}
        passengers={passengers}
        locations={locations}
        onSelect={(populatedSlots) => {
          setResults(null)
          setLegsForSave(null)
          setSlots(populatedSlots)
        }}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Passengers</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setQuickAddOpen(true)}
            className="text-xs min-h-[44px] px-2"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1" />
            New passenger
          </Button>
        </div>
        {passengers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No passengers saved yet. Use the button above or go to <a href="/passengers" className="underline">Passengers</a>.
          </p>
        ) : unselectedPassengers.length > 0 ? (
          <div className="space-y-2">
            <input
              type="text"
              value={passengerSearch}
              onChange={(e) => setPassengerSearch(e.target.value)}
              placeholder="Search passengers…"
              className="w-full border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex flex-wrap gap-2">
              {unselectedPassengers
                .filter((p) => p.name.toLowerCase().includes(passengerSearch.toLowerCase()))
                .map((p) => (
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
            {passengerSearch && unselectedPassengers.filter((p) => p.name.toLowerCase().includes(passengerSearch.toLowerCase())).length === 0 && (
              <p className="text-xs text-muted-foreground">No passengers match &ldquo;{passengerSearch}&rdquo;.</p>
            )}
          </div>
        ) : slots.length > 0 ? (
          <p className="text-xs text-muted-foreground">All passengers added.</p>
        ) : null}
      </div>

      <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add new passenger</DialogTitle></DialogHeader>
          <PassengerForm onDone={handleQuickAddDone} />
        </DialogContent>
      </Dialog>

      {slots.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Trip order</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={slots.map((s) => s.passenger.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {slots.map((slot, i) => (
                  <SortableSlotCard
                    key={slot.passenger.id}
                    slot={slot}
                    index={i}
                    totalSlots={slots.length}
                    onMoveSlot={moveSlot}
                    onRemove={removePassenger}
                    onSetPickerTarget={setPickerTarget}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {lastSlotComplete && (
        <div className="space-y-2">
          {calcError && <p className="text-sm text-destructive">{calcError}</p>}
          <Button
            onClick={handleFinishDay}
            disabled={!allSlotsComplete || calculating}
            className="w-full sm:w-auto"
          >
            {calculating ? "Calculating…" : "Finish day"}
          </Button>
          {!allSlotsComplete && (
            <p className="text-xs text-muted-foreground text-center">Set all drop-off addresses first.</p>
          )}
        </div>
      )}

      {results && <DriveResultsTable results={results} />}

      {results && legsForSave && (
        <SaveSection date={date} legsForSave={legsForSave} onSaved={handleSaved} />
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
          suggestedLocations={pickerTarget.field === "dropoff" ? dropoffSuggestions : []}
        />
      )}
    </div>
  )
}
