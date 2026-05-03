"use client"

import { useState } from "react"
import { Check, Plus, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createLocation } from "../locations/actions"
import type { Location } from "@/lib/supabase/types"

interface Props {
  open: boolean
  onClose: () => void
  locations: Location[]
  passengerHomeAddress: string
  passengerHomeId: string
  selected: string | null
  onSelect: (locationId: string, locationName: string) => void
}

export function DestinationPicker({
  open,
  onClose,
  locations,
  passengerHomeAddress,
  passengerHomeId,
  selected,
  onSelect,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  async function handleAddNew(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError("")
    const result = await createLocation({ name: newName, address: newAddress })
    setSaving(false)
    if (result.error) {
      setSaveError(result.error)
    } else if (result.location) {
      onSelect(result.location.id, result.location.name)
      setNewName("")
      setNewAddress("")
      setShowAddForm(false)
      onClose()
    }
  }

  const homeEntry = { id: passengerHomeId, name: "Home", address: passengerHomeAddress }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Where to?</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-1">
          {/* Passenger's home as an option */}
          <button
            type="button"
            onClick={() => { onSelect(homeEntry.id, homeEntry.name); onClose() }}
            className="w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-accent transition-colors"
          >
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-medium text-sm">Home</span>
              <p className="text-xs text-muted-foreground truncate">{passengerHomeAddress}</p>
            </div>
            {selected === homeEntry.id && <Check className="h-4 w-4 shrink-0" />}
          </button>

          {locations.length > 0 && (
            <div className="pt-1 pb-0.5">
              <p className="text-xs font-medium text-muted-foreground px-3 py-1">Saved locations</p>
            </div>
          )}

          {locations.map((loc) => (
            <button
              key={loc.id}
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
          ))}
        </div>

        <div className="border-t pt-4 mt-2">
          {showAddForm ? (
            <form onSubmit={handleAddNew} className="space-y-3">
              <Input
                placeholder="Location name (e.g. St Vincent's)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <Input
                placeholder="Full address"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                required
              />
              {saveError && <p className="text-xs text-destructive">{saveError}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Saving…" : "Save & select"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add new address
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
