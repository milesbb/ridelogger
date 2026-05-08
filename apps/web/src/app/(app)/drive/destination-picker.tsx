"use client"

import { useState } from "react"
import { Check, Plus, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { api } from "@/lib/api/client"
import type { Location } from "@/lib/api/types"

interface Props {
  open: boolean
  onClose: () => void
  locations: Location[]
  passengerHomeLocationIds: string[]
  selected: string | null
  onSelect: (locationId: string, locationName: string) => void
  onLocationAdded: (location: Location) => void
  suggestedLocations?: Location[]
}

export function DestinationPicker({
  open, onClose, locations, passengerHomeLocationIds,
  selected, onSelect, onLocationAdded, suggestedLocations = [],
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  const homeIdSet = new Set(passengerHomeLocationIds)
  const homeLocations = locations.filter((l) => homeIdSet.has(l.id))
  const otherLocations = locations.filter((l) => !homeIdSet.has(l.id))

  async function handleAddNew(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError("")
    try {
      const location = await api.locations.create({ name: newName, address: newAddress })
      onLocationAdded(location)
      onSelect(location.id, location.name)
      setNewName("")
      setNewAddress("")
      setShowAddForm(false)
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  function LocationRow({ loc }: { loc: Location }) {
    return (
      <button
        type="button"
        onClick={() => { onSelect(loc.id, loc.name); onClose() }}
        className="w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-accent transition-colors"
      >
        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm">{loc.name}</span>
          <p className="text-xs text-muted-foreground truncate">{loc.address}</p>
        </div>
        {selected === loc.id && <Check className="h-4 w-4 shrink-0" />}
      </button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader><DialogTitle>Where to?</DialogTitle></DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-1">
          {suggestedLocations.length > 0 && (
            <>
              <div className="pt-1 pb-0.5">
                <p className="text-xs font-medium text-muted-foreground px-3 py-1">Previously used</p>
              </div>
              {suggestedLocations.map((loc) => <LocationRow key={loc.id} loc={loc} />)}
            </>
          )}

          {otherLocations.length > 0 && (
            <>
              <div className="pt-1 pb-0.5">
                <p className="text-xs font-medium text-muted-foreground px-3 py-1">Saved locations</p>
              </div>
              {otherLocations.map((loc) => <LocationRow key={loc.id} loc={loc} />)}
            </>
          )}

          {homeLocations.length > 0 && (
            <>
              <div className="pt-1 pb-0.5">
                <p className="text-xs font-medium text-muted-foreground px-3 py-1">Passenger homes</p>
              </div>
              {homeLocations.map((loc) => <LocationRow key={loc.id} loc={loc} />)}
            </>
          )}

          {locations.length === 0 && !showAddForm && (
            <p className="text-sm text-muted-foreground px-3 py-4">No saved locations yet.</p>
          )}
        </div>

        <div className="border-t pt-4 mt-2">
          {showAddForm ? (
            <form onSubmit={handleAddNew} className="space-y-3">
              <Input placeholder="Location name (e.g. St Vincent's)" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              <Input placeholder="Full address" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} required />
              {saveError && <p className="text-xs text-destructive">{saveError}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving…" : "Save & select"}</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-1" />Add new address
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
